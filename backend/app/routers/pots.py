from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.pot import Pot, PotStatus, PaymentMethod
from app.models.payment import DayAllocation, DayAllocationStatus
from app.models.agent import Agent, AgentStatus
from app.schemas.pot import PotCreate, PotResponse, PotSummary

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


@router.post("/", response_model=PotResponse)
def create_pot(
    data: PotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate agent if cash payment
    if data.payment_method == PaymentMethod.cash:
        if not data.agent_id:
            raise HTTPException(
                status_code=400,
                detail="Agent is required for cash payments",
            )

        agent = (
            db.query(Agent)
            .filter(
                Agent.id == data.agent_id,
                Agent.status == AgentStatus.active,
            )
            .first()
        )

        if not agent:
            raise HTTPException(
                status_code=404,
                detail="Agent not found or not active",
            )

    # Prevent duplicate active pots
    existing = (
        db.query(Pot)
        .filter(
            Pot.saver_id == current_user.id,
            Pot.name == data.name,
            Pot.status.in_([PotStatus.pending, PotStatus.active]),
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
    status = (
        PotStatus.active
        if data.start_date <= today
        else PotStatus.pending
    )

    pot = Pot(
        saver_id=current_user.id,
        agent_id=data.agent_id,
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

    # Update agent statistics
    if data.agent_id:
        agent = (
            db.query(Agent)
            .filter(Agent.id == data.agent_id)
            .first()
        )

        if agent:
            agent.total_savers += 1

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