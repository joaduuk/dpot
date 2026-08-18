import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.agent import Agent, AgentStatus
from app.models.pot import Pot, PaymentMethod
from app.schemas.agent import AgentApply, AgentProfile, AgentPotSummary, SaverLookupResult

router = APIRouter(prefix="/agents", tags=["Agents"])


def _generate_agent_code(db: Session) -> str:
    """Short, human-enterable code — e.g. AGT-48213 — distinct from the UUID id."""
    while True:
        code = "AGT-" + "".join(random.choices(string.digits, k=5))
        if not db.query(Agent).filter(Agent.agent_code == code).first():
            return code


@router.post("/apply", response_model=AgentProfile)
def apply_as_agent(
    data: AgentApply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    An existing user applies to become an agent. Creates a pending Agent
    profile with a freshly generated agent_code. Approval (flipping status
    to active) is an admin/superadmin action — not built yet, so newly
    applied agents can't actually record payments until that exists.
    """
    existing = db.query(Agent).filter(Agent.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an agent profile")

    agent = Agent(
        user_id=current_user.id,
        agent_code=_generate_agent_code(db),
        market_name=data.market_name,
        location=data.location,
        city=data.city,
        country=data.country,
        mobile_money_number=data.mobile_money_number,
        mobile_money_provider=data.mobile_money_provider,
        status=AgentStatus.pending,
    )
    db.add(agent)

    # Role reflects intent immediately so the frontend can route them to
    # the agent dashboard — actual capability (recording payments) is still
    # gated on Agent.status == active, checked in payments.py.
    current_user.role = UserRole.agent

    db.commit()
    db.refresh(agent)
    return agent


def _get_current_agent(db: Session, current_user: User) -> Agent:
    agent = db.query(Agent).filter(Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=403, detail="Agent profile not found")
    return agent


@router.get("/me", response_model=AgentProfile)
def get_my_agent_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_current_agent(db, current_user)


def _to_summary(pot: Pot, saver_name: str, saver_phone: str) -> AgentPotSummary:
    return AgentPotSummary(
        id=pot.id,
        name=pot.name,
        saver_name=saver_name,
        saver_phone=saver_phone,
        daily_amount=pot.daily_amount,
        currency=pot.currency,
        payment_method=pot.payment_method.value,
        status=pot.status.value,
        days_paid=pot.days_paid,
        buffer_days=pot.buffer_days,
        total_collected=pot.total_collected,
    )


@router.get("/me/pots", response_model=List[AgentPotSummary])
def list_my_savers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pots this agent has already claimed (recorded at least one payment for)."""
    agent = _get_current_agent(db, current_user)
    pots = db.query(Pot).filter(Pot.agent_id == agent.id).all()
    return [_to_summary(p, p.saver.full_name, p.saver.phone) for p in pots]


@router.get("/lookup", response_model=SaverLookupResult)
def lookup_saver_by_phone(
    phone: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Find a saver's cash pots by phone number, so an agent can record a
    payment even for a pot they haven't claimed yet (e.g. its first ever
    payment). Only ever shows cash pots that are unclaimed or already
    assigned to THIS agent — never another agent's claimed pot.
    """
    _get_current_agent(db, current_user)  # just verifying caller is a real agent
    agent = _get_current_agent(db, current_user)

    saver = db.query(User).filter(User.phone == phone, User.role == UserRole.saver).first()
    if not saver:
        raise HTTPException(status_code=404, detail="No saver found with that phone number")

    pots = (
        db.query(Pot)
        .filter(
            Pot.saver_id == saver.id,
            Pot.payment_method == PaymentMethod.cash,
            (Pot.agent_id == None) | (Pot.agent_id == agent.id),
        )
        .all()
    )

    return SaverLookupResult(
        saver_name=saver.full_name,
        saver_phone=saver.phone,
        pots=[_to_summary(p, saver.full_name, saver.phone) for p in pots],
    )