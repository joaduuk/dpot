from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from app.models.agent import AgentStatus


class PendingAgent(BaseModel):
    id: UUID
    agent_code: Optional[str]
    market_name: str
    location: str
    city: str
    country: str
    mobile_money_number: Optional[str]
    mobile_money_provider: Optional[str]
    status: AgentStatus
    applicant_name: str
    applicant_phone: str
    created_at: datetime

    class Config:
        from_attributes = True


class PendingPayment(BaseModel):
    id: UUID
    pot_id: UUID
    pot_name: str
    saver_name: str
    agent_market_name: Optional[str]
    amount: float
    days_covered: int
    method: str
    reference: Optional[str]
    recorded_at: datetime

    class Config:
        from_attributes = True


class PendingPayout(BaseModel):
    id: UUID
    pot_id: UUID
    pot_name: str
    saver_name: str
    days_paid: int
    gross_amount: float
    platform_fee: float
    agent_commission: float
    net_payout: float
    method: str
    mobile_money_number: Optional[str]
    bank_account: Optional[str]
    requested_payout_date: Optional[date]
    requested_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Savers ────────────────────────────────────────────────────────────────

class SaverSummary(BaseModel):
    id: UUID
    full_name: str
    phone: str
    email: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SaverPotSummary(BaseModel):
    id: UUID
    name: str
    daily_amount: float
    currency: str
    status: str
    days_paid: int
    buffer_days: int
    total_collected: float

    class Config:
        from_attributes = True


# ── Admins (super_admin only) ────────────────────────────────────────────

class AdminCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    password: str
    role: str = "admin"  # "admin" or "super_admin"


class AdminSummary(BaseModel):
    id: UUID
    full_name: str
    phone: str
    email: Optional[str]
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Agents (full management, super_admin only) ───────────────────────────

class AgentSummary(BaseModel):
    id: UUID
    agent_code: Optional[str]
    market_name: str
    location: str
    city: str
    status: AgentStatus
    total_savers: int
    applicant_name: str
    applicant_phone: str
    created_at: datetime

    class Config:
        from_attributes = True
        
class UserLookupResult(BaseModel):
    id: UUID
    full_name: str
    phone: str
    email: Optional[str]
    role: str
    status: str
    has_agent_profile: bool

    class Config:
        from_attributes = True


class AdminAgentRegisterExisting(BaseModel):
    user_id: UUID
    market_name: str
    location: str
    city: str
    country: str = "GH"
    mobile_money_number: Optional[str] = None
    mobile_money_provider: Optional[str] = None


class AdminAgentRegisterNew(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    password: str
    market_name: str
    location: str
    city: str
    country: str = "GH"
    mobile_money_number: Optional[str] = None
    mobile_money_provider: Optional[str] = None