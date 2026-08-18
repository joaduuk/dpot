from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.pot import Pot, PotStatus, PaymentMethod
from app.models.payment import DayAllocation, DayAllocationStatus
from app.models.agent import Agent, AgentStatus
from app.models.payout import Payout, PayoutStatus
from app.schemas.pot import PotCreate, PotResponse, PotSummary
from app.schemas.payout import PayoutRequest, PayoutResponse

router = APIRouter(prefix="/pots", tags=["Pots"])


def create_day_allocations(db: Session, pot_id: UUID):
    """
    Create 31 day slots for a new pot.

    Days 1-30 = Saver payment days
    Day 31 = Platform fee day
    """
    for day in range(1, 32):
        allocation = DayAllocation(
            pot_id=pot_id,
            day_number=day,
            status=DayAllocationStatus.unpaid,
            is_fee_day=(day == 31),
        )
        db.add(allocation)


def _maybe_activate(pot: Pot, db: Session):
    """
    No scheduler exists on this backend — lazily flip pending -> active the
    moment anyone reads a pot whose start date has arrived. Without this, a
    pot created for a future date stays "pending" forever, even long after
    that date has passed.
    """
    if pot.status == PotStatus.pending and pot.start_date <= date.today():
        pot.status = PotStatus.active
        db.commit()
        db.refresh(pot)


@router.post("/", response_model=PotResponse)
def create_pot(
    data: PotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Prevent duplicate active pots
    existing = (
        db.query(Pot)
        .filter(
            Pot.saver_id == current_user.id,
            Pot.name == data.name,
            Pot.status.in_([PotStatus.pending, PotStatus.active, PotStatus.awaiting_agent]),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have an active pot with this name",
        )

    # 30 calendar saving days
    end_date = data.start_date + timedelta(days=29)
    today = date.today()

    if data.payment_method == PaymentMethod.cash:
        # No agent required up front — the pot activates the moment an
        # agent records the saver's first cash payment (see record_payment
        # in payments.py), which locks that agent to this pot permanently.
        status = PotStatus.awaiting_agent
    else:
        status = PotStatus.active if data.start_date <= today else PotStatus.pending

    pot = Pot(
        saver_id=current_user.id,
        agent_id=None,  # cash pots start unassigned; claimed on first payment
        name=data.name,
        daily_amount=data.daily_amount,
        currency=data.currency,
        payment_method=data.payment_method,
        start_date=data.start_date,
        end_date=end_date,
        status=status,
    )

    db.add(pot)
    db.flush()

    # Create 31 board slots
    create_day_allocations(db, pot.id)

    db.commit()
    db.refresh(pot)

    return pot


@router.get("/", response_model=List[PotSummary])
def list_my_pots(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pots = (
        db.query(Pot)
        .filter(Pot.saver_id == current_user.id)
        .all()
    )

    today = date.today()
    changed = False
    for pot in pots:
        if pot.status == PotStatus.pending and pot.start_date <= today:
            pot.status = PotStatus.active
            changed = True
    if changed:
        db.commit()

    result = []

    for pot in pots:
        progress = (pot.days_paid / 30) * 100

        result.append(
            PotSummary(
                id=pot.id,
                name=pot.name,
                daily_amount=pot.daily_amount,
                currency=pot.currency,
                status=pot.status,
                days_paid=pot.days_paid,
                buffer_days=pot.buffer_days,
                total_collected=pot.total_collected,
                start_date=pot.start_date,
                end_date=pot.end_date,
                progress_percent=round(progress, 1),
            )
        )

    return result


@router.get("/{pot_id}", response_model=PotResponse)
def get_pot(
    pot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pot = (
        db.query(Pot)
        .filter(
            Pot.id == pot_id,
            Pot.saver_id == current_user.id,
        )
        .first()
    )

    if not pot:
        raise HTTPException(
            status_code=404,
            detail="Pot not found",
        )

    _maybe_activate(pot, db)

    return pot


@router.get("/{pot_id}/board")
def get_pot_board(
    pot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the 31-dot board.

    Days 1-30 = Saving days
    Day 31 = Platform fee day
    """

    pot = (
        db.query(Pot)
        .filter(
            Pot.id == pot_id,
            Pot.saver_id == current_user.id,
        )
        .first()
    )

    if not pot:
        raise HTTPException(
            status_code=404,
            detail="Pot not found",
        )

    _maybe_activate(pot, db)

    allocations = (
        db.query(DayAllocation)
        .filter(DayAllocation.pot_id == pot_id)
        .order_by(DayAllocation.day_number)
        .all()
    )

    days = [
        {
            "day_number": allocation.day_number,
            "status": allocation.status.value,
            "is_fee_day": allocation.is_fee_day,
            "allocated_at": allocation.allocated_at,
        }
        for allocation in allocations
    ]

    return {
        "pot_id": str(pot.id),
        "name": pot.name,
        "daily_amount": pot.daily_amount,
        "currency": pot.currency,
        "days_paid": pot.days_paid,
        "buffer_days": pot.buffer_days,
        "total_collected": pot.total_collected,
        "progress_percent": round((pot.days_paid / 30) * 100, 1),
        "days": days,
    }


# ── Payout ────────────────────────────────────────────────────────────────
# Early cashout is allowed any time at least one day is confirmed — not
# gated behind the pot being fully paid. Day 31 (the fee day) gets no
# special treatment here: every confirmed day, 1 through 31, counts toward
# gross_amount the same way. The flat platform fee is always deducted once
# at payout time, regardless of whether day 31 specifically was paid.

@router.post("/{pot_id}/payout/request", response_model=PayoutResponse)
def request_payout(
    pot_id: UUID,
    data: PayoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pot = (
        db.query(Pot)
        .filter(Pot.id == pot_id, Pot.saver_id == current_user.id)
        .first()
    )
    if not pot:
        raise HTTPException(status_code=404, detail="Pot not found")

    existing = db.query(Payout).filter(Payout.pot_id == pot_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="A payout has already been requested for this pot")

    if data.method == "mobile_money" and not data.mobile_money_number:
        raise HTTPException(status_code=400, detail="Mobile money number is required for this method")
    if data.method == "bank_transfer" and not data.bank_account:
        raise HTTPException(status_code=400, detail="Bank account is required for this method")

    confirmed_days = (
        db.query(DayAllocation)
        .filter(DayAllocation.pot_id == pot_id, DayAllocation.status == DayAllocationStatus.confirmed)
        .count()
    )
    if confirmed_days <= 0:
        raise HTTPException(
            status_code=400,
            detail="No contribution has been made on this pot yet",
        )

    gross_amount = confirmed_days * pot.daily_amount
    platform_fee = pot.daily_amount  # TODO: confirm fee rule for early (partial) cashouts
    agent_commission = 0.0  # TODO: plug in real commission rate for cash/agent-assisted pots
    net_payout = gross_amount - platform_fee - agent_commission

    now = datetime.utcnow()
    payout = Payout(
        pot_id=pot_id,
        days_paid=confirmed_days,
        daily_amount=pot.daily_amount,
        gross_amount=gross_amount,
        platform_fee=platform_fee,
        agent_commission=agent_commission,
        net_payout=net_payout,
        method=data.method,
        mobile_money_number=data.mobile_money_number,
        bank_account=data.bank_account,
        status=PayoutStatus.pending,
        requested_at=now,
        notice_given_at=now,
        eligible_at=now + timedelta(hours=24),
        requested_payout_date=data.requested_payout_date or now.date(),
    )
    db.add(payout)
    db.commit()
    db.refresh(payout)
    return payout


@router.get("/{pot_id}/payout", response_model=PayoutResponse)
def get_payout_status(
    pot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pot = (
        db.query(Pot)
        .filter(Pot.id == pot_id, Pot.saver_id == current_user.id)
        .first()
    )
    if not pot:
        raise HTTPException(status_code=404, detail="Pot not found")

    payout = db.query(Payout).filter(Payout.pot_id == pot_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="No payout has been requested for this pot")
    return payout


@router.put("/{pot_id}/payout/complete", response_model=PayoutResponse)
def complete_payout(
    pot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin marks a requested payout as actually paid out."""
    if getattr(current_user, "role", None) not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to complete payouts")

    payout = db.query(Payout).filter(Payout.pot_id == pot_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="No payout has been requested for this pot")
    if payout.status == PayoutStatus.completed:
        raise HTTPException(status_code=400, detail="Payout has already been completed")

    payout.status = PayoutStatus.completed
    payout.completed_at = datetime.utcnow()

    pot = db.query(Pot).filter(Pot.id == pot_id).first()
    if pot:
        pot.status = PotStatus.cashed_out

    db.commit()
    db.refresh(payout)
    return payout