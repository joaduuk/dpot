from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.agent import AgentStatus


class AgentApply(BaseModel):
    market_name: str
    location: str
    city: str
    country: str = "GH"
    mobile_money_number: Optional[str] = None
    mobile_money_provider: Optional[str] = None


class AgentProfile(BaseModel):
    id: UUID
    agent_code: Optional[str]
    market_name: str
    location: str
    city: str
    country: str
    mobile_money_number: Optional[str]
    mobile_money_provider: Optional[str]
    status: AgentStatus
    total_savers: int
    total_commission_earned: float
    created_at: datetime

    class Config:
        from_attributes = True


class AgentPotSummary(BaseModel):
    id: UUID
    name: str
    saver_name: str
    saver_phone: str
    daily_amount: float
    currency: str
    payment_method: str
    status: str
    days_paid: int
    buffer_days: int
    total_collected: float

    class Config:
        from_attributes = True


class SaverLookupResult(BaseModel):
    saver_name: str
    saver_phone: str
    pots: List[AgentPotSummary]