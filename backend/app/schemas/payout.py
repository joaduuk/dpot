from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date, datetime
from uuid import UUID
from app.models.payout import PayoutStatus


class PayoutRequest(BaseModel):
    method: Literal["cash", "mobile_money", "bank_transfer"]
    mobile_money_number: Optional[str] = None
    bank_account: Optional[str] = None
    requested_payout_date: Optional[date] = Field(
        None, description="Date the saver wants to be paid — defaults to today if omitted"
    )


class PayoutResponse(BaseModel):
    id: UUID
    pot_id: UUID
    days_paid: int
    daily_amount: float
    gross_amount: float
    platform_fee: float
    agent_commission: float
    net_payout: float
    method: str
    mobile_money_number: Optional[str]
    bank_account: Optional[str]
    status: PayoutStatus
    requested_at: Optional[datetime]
    notice_given_at: Optional[datetime]
    eligible_at: Optional[datetime]
    requested_payout_date: Optional[date]
    completed_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True