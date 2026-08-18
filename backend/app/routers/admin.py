from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.models.agent import Agent, AgentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.pot import Pot
from app.models.payout import Payout, PayoutStatus
from app.schemas.agent import AgentProfile
from app.routers.agents import _generate_agent_code
from app.schemas.admin import (
    PendingAgent, PendingPayment, PendingPayout,
    SaverSummary, SaverPotSummary,
    AdminCreate, AdminSummary, AgentSummary,
    UserLookupResult, AdminAgentRegisterExisting, AdminAgentRegisterNew,
)
from app.routers.payments import _smart_allocate

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(current_user: User):
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(status_code=403, detail="Admin access required")


def _require_super_admin(current_user: User):
    if current_user.role != UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")


# ── Agents (pending approval — admin + super_admin) ──────────────────────

@router.get("/agents/pending", response_model=List[PendingAgent])
def list_pending_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    agents = db.query(Agent).filter(Agent.status == AgentStatus.pending).all()
    return [
        PendingAgent(
            id=a.id, agent_code=a.agent_code, market_name=a.market_name,
            location=a.location, city=a.city, country=a.country,
            mobile_money_number=a.mobile_money_number,
            mobile_money_provider=a.mobile_money_provider, status=a.status,
            applicant_name=a.user.full_name, applicant_phone=a.user.phone,
            created_at=a.created_at,
        )
        for a in agents
    ]

# ── Admin-driven agent registration (admin + super_admin) ────────────────
# Unlike self-service /agents/apply (which lands as "pending"), an agent
# registered here by an admin is auto-approved — the admin has already
# vetted them, so there's no separate approval queue to sit in.

@router.get("/users/lookup", response_model=UserLookupResult)
def lookup_user_by_phone(
    phone: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found with that phone number")

    has_agent_profile = db.query(Agent).filter(Agent.user_id == user.id).first() is not None
    return UserLookupResult(
        id=user.id, full_name=user.full_name, phone=user.phone, email=user.email,
        role=user.role.value, status=user.status.value, has_agent_profile=has_agent_profile,
    )


@router.post("/agents/register-existing", response_model=AgentProfile)
def register_agent_existing(
    data: AdminAgentRegisterExisting,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Agent).filter(Agent.user_id == user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This user already has an agent profile")

    agent = Agent(
        user_id=user.id,
        agent_code=_generate_agent_code(db),
        market_name=data.market_name,
        location=data.location,
        city=data.city,
        country=data.country,
        mobile_money_number=data.mobile_money_number,
        mobile_money_provider=data.mobile_money_provider,
        status=AgentStatus.active,
        approved_at=datetime.utcnow(),
        approved_by=current_user.id,
    )
    db.add(agent)
    user.role = UserRole.agent
    db.commit()
    db.refresh(agent)
    return agent


@router.post("/agents/register-new", response_model=AgentProfile)
def register_agent_new(
    data: AdminAgentRegisterNew,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)

    existing_user = db.query(User).filter(User.phone == data.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this phone number already exists — look them up instead",
        )

    user = User(
        full_name=data.full_name,
        phone=data.phone,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=UserRole.agent,
        status=UserStatus.active,
    )
    db.add(user)
    db.flush()

    agent = Agent(
        user_id=user.id,
        agent_code=_generate_agent_code(db),
        market_name=data.market_name,
        location=data.location,
        city=data.city,
        country=data.country,
        mobile_money_number=data.mobile_money_number,
        mobile_money_provider=data.mobile_money_provider,
        status=AgentStatus.active,
        approved_at=datetime.utcnow(),
        approved_by=current_user.id,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent

@router.put("/agents/{agent_id}/approve")
def approve_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = AgentStatus.active
    agent.approved_at = datetime.utcnow()
    agent.approved_by = current_user.id
    db.commit()
    return {"message": "Agent approved"}


@router.put("/agents/{agent_id}/reject")
def reject_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = AgentStatus.suspended
    db.commit()
    return {"message": "Agent rejected"}


# ── Payments (admin + super_admin) ───────────────────────────────────────

@router.get("/payments/pending", response_model=List[PendingPayment])
def list_pending_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    payments = db.query(Payment).filter(Payment.status == PaymentStatus.pending).all()
    return [
        PendingPayment(
            id=p.id, pot_id=p.pot_id, pot_name=p.pot.name,
            saver_name=p.pot.saver.full_name,
            agent_market_name=p.agent.market_name if p.agent else None,
            amount=p.amount, days_covered=p.days_covered, method=p.method,
            reference=p.reference, recorded_at=p.recorded_at,
        )
        for p in payments
    ]


@router.put("/payments/{payment_id}/confirm")
def confirm_payment(
    payment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == PaymentStatus.confirmed:
        raise HTTPException(status_code=400, detail="Payment is already confirmed")

    pot = db.query(Pot).filter(Pot.id == payment.pot_id).first()
    if not pot:
        raise HTTPException(status_code=404, detail="Pot not found")

    payment.status = PaymentStatus.confirmed
    payment.confirmed_at = datetime.utcnow()
    _smart_allocate(db, pot, payment, payment.days_covered)

    db.commit()
    return {"message": "Payment confirmed", "days_paid": pot.days_paid, "buffer_days": pot.buffer_days}


@router.put("/payments/{payment_id}/dispute")
def dispute_payment(
    payment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = PaymentStatus.disputed
    db.commit()
    return {"message": "Payment marked as disputed"}


# ── Payouts (listing — admin + super_admin; completion via
#    PUT /pots/{pot_id}/payout/complete, admin/super_admin only) ─────────

@router.get("/payouts/pending", response_model=List[PendingPayout])
def list_pending_payouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    payouts = db.query(Payout).filter(Payout.status == PayoutStatus.pending).all()
    return [
        PendingPayout(
            id=p.id, pot_id=p.pot_id, pot_name=p.pot.name,
            saver_name=p.pot.saver.full_name, days_paid=p.days_paid,
            gross_amount=p.gross_amount, platform_fee=p.platform_fee,
            agent_commission=p.agent_commission, net_payout=p.net_payout,
            method=p.method, mobile_money_number=p.mobile_money_number,
            bank_account=p.bank_account,
            requested_payout_date=p.requested_payout_date,
            requested_at=p.requested_at,
        )
        for p in payouts
    ]


# ── Savers (admin + super_admin) ─────────────────────────────────────────

@router.get("/savers", response_model=List[SaverSummary])
def list_savers(
    search: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    query = db.query(User).filter(User.role == UserRole.saver)
    if search:
        like = f"%{search}%"
        query = query.filter((User.full_name.ilike(like)) | (User.phone.ilike(like)))
    return query.order_by(User.full_name).limit(100).all()


@router.get("/savers/{saver_id}/pots", response_model=List[SaverPotSummary])
def list_saver_pots(
    saver_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    saver = db.query(User).filter(User.id == saver_id, User.role == UserRole.saver).first()
    if not saver:
        raise HTTPException(status_code=404, detail="Saver not found")

    pots = db.query(Pot).filter(Pot.saver_id == saver_id).all()
    return [
        SaverPotSummary(
            id=p.id, name=p.name, daily_amount=p.daily_amount, currency=p.currency,
            status=p.status.value, days_paid=p.days_paid, buffer_days=p.buffer_days,
            total_collected=p.total_collected,
        )
        for p in pots
    ]


# ── Admins (super_admin only) ────────────────────────────────────────────

@router.get("/admins", response_model=List[AdminSummary])
def list_admins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    admins = (
        db.query(User)
        .filter(User.role.in_([UserRole.admin, UserRole.super_admin]))
        .order_by(User.full_name)
        .all()
    )
    return [
        AdminSummary(
            id=a.id, full_name=a.full_name, phone=a.phone, email=a.email,
            role=a.role.value, status=a.status.value, created_at=a.created_at,
        )
        for a in admins
    ]


@router.post("/admins", response_model=AdminSummary)
def create_admin(
    data: AdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)

    if data.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=400, detail="Role must be admin or super_admin")

    existing = db.query(User).filter(User.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this phone number already exists")

    new_admin = User(
        full_name=data.full_name,
        phone=data.phone,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=UserRole(data.role),
        status=UserStatus.active,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return AdminSummary(
        id=new_admin.id, full_name=new_admin.full_name, phone=new_admin.phone,
        email=new_admin.email, role=new_admin.role.value,
        status=new_admin.status.value, created_at=new_admin.created_at,
    )


@router.put("/admins/{user_id}/suspend")
def suspend_admin(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't suspend your own account")

    admin = (
        db.query(User)
        .filter(User.id == user_id, User.role.in_([UserRole.admin, UserRole.super_admin]))
        .first()
    )
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    admin.status = UserStatus.suspended
    db.commit()
    return {"message": "Admin suspended"}


@router.put("/admins/{user_id}/activate")
def activate_admin(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    admin = (
        db.query(User)
        .filter(User.id == user_id, User.role.in_([UserRole.admin, UserRole.super_admin]))
        .first()
    )
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    admin.status = UserStatus.active
    db.commit()
    return {"message": "Admin activated"}


@router.delete("/admins/{user_id}")
def delete_admin(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't delete your own account")

    admin = (
        db.query(User)
        .filter(User.id == user_id, User.role.in_([UserRole.admin, UserRole.super_admin]))
        .first()
    )
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    db.delete(admin)
    db.commit()
    return {"message": "Admin deleted"}


# ── Agents — full management (super_admin only) ──────────────────────────

@router.get("/agents", response_model=List[AgentSummary])
def list_all_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    agents = db.query(Agent).order_by(Agent.market_name).all()
    return [
        AgentSummary(
            id=a.id, agent_code=a.agent_code, market_name=a.market_name,
            location=a.location, city=a.city, status=a.status,
            total_savers=a.total_savers, applicant_name=a.user.full_name,
            applicant_phone=a.user.phone, created_at=a.created_at,
        )
        for a in agents
    ]


@router.put("/agents/{agent_id}/suspend-full")
def suspend_agent_full(
    agent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Suspend an already-active agent (distinct from rejecting a pending application)."""
    _require_super_admin(current_user)
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = AgentStatus.suspended
    db.commit()
    return {"message": "Agent suspended"}


@router.delete("/agents/{agent_id}")
def delete_agent(
    agent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    assigned_pots = db.query(Pot).filter(Pot.agent_id == agent_id).count()
    if assigned_pots > 0:
        raise HTTPException(
            status_code=400,
            detail=f"This agent has {assigned_pots} assigned pot(s) — suspend instead of deleting",
        )

    db.delete(agent)
    db.commit()
    return {"message": "Agent deleted"}