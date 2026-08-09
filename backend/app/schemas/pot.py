from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from app.models.pot import PotStatus, PaymentMethod


class PotCreate(BaseModel):
    name: str = Field(..., description="e.g. Market Pot, School Fees")
    daily_amount: float = Field(..., gt=0)
    currency: str = "GHS"
    payment_method: PaymentMethod
    start_date: date
    agent_id: Optional[UUID] = None  # required if payment_method is cash


class PotResponse(BaseModel):
    id: UUID
    saver_id: UUID
    agent_id: Optional[UUID]
    name: str
    daily_amount: float
    currency: str
    payment_method: PaymentMethod
    start_date: date
    end_date: date
    status: PotStatus
    days_paid: int
    buffer_days: int
    total_collected: float
    payout_requested_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class PotSummary(BaseModel):
    id: UUID
    name: str
    daily_amount: float
    currency: str
    status: PotStatus
    days_paid: int
    buffer_days: int
    total_collected: float
    start_date: date
    end_date: date
    progress_percent: float

    class Config:
        from_attributes = True