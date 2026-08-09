from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.pot import Pot, PotStatus
from app.models.payment import Payment, DayAllocation, PaymentStatus, DayAllocationStatus
from app.models.agent import Agent
from app.models.wallet import Wallet, WalletTransaction, WalletTransactionType, WalletTransactionReason
from app.schemas.payment import RecordPayment, AllocateBuffer, PaymentResponse, PaymentInfo

router = APIRouter(prefix="/payments", tags=["Payments"])


# ── Helpers ───────────────────────────────────────────────────────────────

def get_today_day_number(pot: Pot) -> int:
    """Calculate today's day number in the pot cycle (calendar based)."""
    today = date.today()
    if today < pot.start_date:
        return 0
    delta = (today - pot.start_date).days + 1
    return min(delta, 30)


def get_or_create_wallet(db: Session, user_id: UUID, currency: str) -> Wallet:
    """Get existing wallet or create one for the user."""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0.0, currency=currency)
        db.add(wallet)
        db.flush()
    return wallet


def _get_active_pot(pot_id: UUID, user_id: UUID, db: Session) -> Pot:
    """Get pot and verify it belongs to user and is active."""
    pot = db.query(Pot).filter(Pot.id == pot_id).first()
    if not pot:
        raise HTTPException(status_code=404, detail="Pot not found")
    if pot.saver_id != user_id:
        raise HTTPException(status_code=403, detail="Not your pot")
    if pot.status not in [PotStatus.active, PotStatus.pending]:
        raise HTTPException(status_code=400, detail="Pot is not active")
    return pot


def _smart_allocate(db: Session, pot: Pot, payment: Payment, days_covered: int):
    """
    Smart allocation:
    1. Fill today's day first (if unpaid)
    2. Remaining days go to buffer for saver to drag manually
    """
    today_day = get_today_day_number(pot)
    allocated = 0

    # Step 1: Fill today's day first
    if today_day > 0:
        today_slot = db.query(DayAllocation).filter(
            DayAllocation.pot_id == pot.id,
            DayAllocation.day_number == today_day,
            DayAllocation.status == DayAllocationStatus.unpaid,
            DayAllocation.is_fee_day == False,
        ).first()

        if today_slot:
            today_slot.status = DayAllocationStatus.confirmed
            today_slot.payment_id = payment.id
            today_slot.allocated_at = datetime.utcnow()
            allocated += 1

    # Step 2: Rest go to buffer
    remaining = days_covered - allocated
    pot.days_paid += allocated
    pot.buffer_days += remaining

    # Check pot completion
    if pot.days_paid >= 30:
        pot.status = PotStatus.completed
        _fill_fee_day(db, pot)


def _fill_fee_day(db: Session, pot: Pot):
    """Mark day 31 (fee day) as confirmed when pot completes."""
    fee_day = db.query(DayAllocation).filter(
        DayAllocation.pot_id == pot.id,
        DayAllocation.is_fee_day == True,
    ).first()
    if fee_day and fee_day.status == DayAllocationStatus.unpaid:
        fee_day.status = DayAllocationStatus.confirmed
        fee_day.allocated_at = datetime.utcnow()


# ── Payment info endpoint ─────────────────────────────────────────────────

@router.get("/info/{pot_id}", response_model=PaymentInfo)
def get_payment_info(
    pot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns everything the UI needs to build the payment screen.
    Shows remaining days, wallet balance, max payable days.
    """
    pot = _get_active_pot(pot_id, current_user.id, db)
    wallet = get_or_create_wallet(db, current_user.id, pot.currency)
    db.commit()

    remaining_days = 30 - (pot.days_paid + pot.buffer_days)
    wallet_days = int(wallet.balance / pot.daily_amount) if wallet.balance > 0 else 0
    max_payable = min(remaining_days, remaining_days)  # UI caps at remaining

    return PaymentInfo(
        pot_id=pot.id,
        pot_name=pot.name,
        daily_amount=pot.daily_amount,
        currency=pot.currency,
        days_paid=pot.days_paid,
        buffer_days=pot.buffer_days,
        remaining_days=remaining_days,
        max_days_payable=max_payable,
        wallet_balance=wallet.balance,
        wallet_currency=wallet.currency,
    )


# ── Record payment ────────────────────────────────────────────────────────

@router.post("/record", response_model=PaymentResponse)
def record_payment(
    data: RecordPayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a payment for a pot.
    - Saver sends days_to_pay (not amount)
    - Backend calculates amount = days_to_pay * daily_amount
    - Today's day fills first, rest go to buffer
    - Optional: use wallet credit toward payment
    """

    # ── Determine recorder ────────────────────────────────────────────────
    if current_user.role == UserRole.saver:
        pot = _get_active_pot(data.pot_id, current_user.id, db)
        if pot.payment_method.value == "cash":
            raise HTTPException(
                status_code=400,
                detail="Cash payments must be recorded by your agent"
            )
        recorded_by = "saver"
        agent_id = None
        pay_status = PaymentStatus.confirmed
    else:
        # Agent recording cash payment
        agent = db.query(Agent).filter(Agent.user_id == current_user.id).first()
        if not agent:
            raise HTTPException(status_code=403, detail="Agent profile not found")
        pot = db.query(Pot).filter(Pot.id == data.pot_id).first()
        if not pot:
            raise HTTPException(status_code=404, detail="Pot not found")
        if pot.agent_id != agent.id:
            raise HTTPException(status_code=403, detail="This saver is not assigned to you")
        if pot.status not in [PotStatus.active, PotStatus.pending]:
            raise HTTPException(status_code=400, detail="Pot is not active")
        recorded_by = "agent"
        agent_id = agent.id
        pay_status = PaymentStatus.pending

    # ── Validate days ─────────────────────────────────────────────────────
    remaining_days = 30 - (pot.days_paid + pot.buffer_days)

    if remaining_days <= 0:
        raise HTTPException(status_code=400, detail="This pot is already fully paid")

    if data.days_to_pay > remaining_days:
        raise HTTPException(
            status_code=400,
            detail=f"You can only pay for {remaining_days} day(s). "
                   f"Requested: {data.days_to_pay}"
        )

    # ── Calculate amount ──────────────────────────────────────────────────
    full_amount = data.days_to_pay * pot.daily_amount
    wallet_credit_used = 0.0

    # ── Handle wallet credit ──────────────────────────────────────────────
    if data.use_wallet_credit and current_user.role == UserRole.saver:
        wallet = get_or_create_wallet(db, current_user.id, pot.currency)

        if wallet.balance > 0:
            credit_to_use = min(wallet.balance, full_amount)
            wallet.balance -= credit_to_use
            wallet_credit_used = credit_to_use

            # Record wallet debit transaction
            db.add(WalletTransaction(
                wallet_id=wallet.id,
                amount=credit_to_use,
                type=WalletTransactionType.debit,
                reason=WalletTransactionReason.pot_payment,
                note=f"Used toward {pot.name} — {data.days_to_pay} day(s)",
            ))

    # ── Record payment ────────────────────────────────────────────────────
    payment = Payment(
        pot_id=pot.id,
        agent_id=agent_id,
        amount=full_amount,
        days_covered=data.days_to_pay,
        method=data.method,
        status=pay_status,
        reference=data.reference,
        recorded_by=recorded_by,
        wallet_credit_used=wallet_credit_used,
        recorded_at=datetime.utcnow(),
        confirmed_at=datetime.utcnow() if pay_status == PaymentStatus.confirmed else None,
    )
    db.add(payment)
    db.flush()

    pot.total_collected += full_amount

    # ── Smart allocation ──────────────────────────────────────────────────
    if pay_status == PaymentStatus.confirmed:
        _smart_allocate(db, pot, payment, data.days_to_pay)

    db.commit()
    db.refresh(payment)
    return payment


# ── Allocate buffer day ───────────────────────────────────────────────────

@router.post("/allocate")
def allocate_buffer_day(
    data: AllocateBuffer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Saver drags a buffer payment onto a specific unpaid day.
    This is the core drag-and-drop action.
    """
    pot = _get_active_pot(data.pot_id, current_user.id, db)

    if pot.buffer_days < 1:
        raise HTTPException(status_code=400, detail="No buffer payments to allocate")

    if data.day_number == 31:
        raise HTTPException(status_code=400, detail="Day 31 is the platform fee day")

    day = db.query(DayAllocation).filter(
        DayAllocation.pot_id == pot.id,
        DayAllocation.day_number == data.day_number,
        DayAllocation.is_fee_day == False,
    ).first()

    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    if day.status != DayAllocationStatus.unpaid:
        raise HTTPException(
            status_code=400,
            detail=f"Day {data.day_number} is already {day.status.value}"
        )

    # Link to oldest confirmed payment
    payment = db.query(Payment).filter(
        Payment.pot_id == pot.id,
        Payment.status == PaymentStatus.confirmed,
    ).order_by(Payment.recorded_at).first()

    day.status = DayAllocationStatus.confirmed
    day.payment_id = payment.id if payment else None
    day.allocated_at = datetime.utcnow()

    pot.days_paid += 1
    pot.buffer_days -= 1

    # Check completion
    if pot.days_paid >= 30:
        pot.status = PotStatus.completed
        _fill_fee_day(db, pot)

    db.commit()

    return {
        "message": f"Day {data.day_number} allocated successfully",
        "days_paid": pot.days_paid,
        "buffer_days": pot.buffer_days,
        "progress_percent": round((pot.days_paid / 30) * 100, 1),
        "pot_complete": pot.status == PotStatus.completed,
    }


# ── List payments ─────────────────────────────────────────────────────────

@router.get("/pot/{pot_id}", response_model=List[PaymentResponse])
def list_pot_payments(
    pot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all payments for a pot."""
    pot = db.query(Pot).filter(Pot.id == pot_id).first()
    if not pot:
        raise HTTPException(status_code=404, detail="Pot not found")
    if pot.saver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your pot")

    return db.query(Payment).filter(
        Payment.pot_id == pot_id
    ).order_by(Payment.recorded_at.desc()).all()


# ── Wallet endpoints ──────────────────────────────────────────────────────

@router.get("/wallet")
def get_my_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's wallet balance and recent transactions."""
    wallet = get_or_create_wallet(db, current_user.id, "GHS")
    db.commit()

    transactions = db.query(WalletTransaction).filter(
        WalletTransaction.wallet_id == wallet.id
    ).order_by(WalletTransaction.created_at.desc()).limit(20).all()

    return {
        "wallet_id": str(wallet.id),
        "balance": wallet.balance,
        "currency": wallet.currency,
        "transactions": [
            {
                "id": str(t.id),
                "amount": t.amount,
                "type": t.type.value,
                "reason": t.reason.value,
                "note": t.note,
                "created_at": t.created_at,
            }
            for t in transactions
        ]
    }