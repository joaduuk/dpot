from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.payment import PaymentStatus


class RecordPayment(BaseModel):
    pot_id: UUID
    days_to_pay: int = Field(..., ge=1, le=31)   # was le=30 — a saver could otherwise never pay day 31 in one go
    method: str = Field(..., description="cash | mobile_money | bank_transfer")
    reference: Optional[str] = None
    use_wallet_credit: bool = False


class AllocateBuffer(BaseModel):
    pot_id: UUID
    day_number: int = Field(..., ge=1, le=31)   # was le=30 — this was the actual bug: blocked dragging onto day 31


class PaymentResponse(BaseModel):
    id: UUID
    pot_id: UUID
    amount: float
    days_covered: int
    method: str
    status: PaymentStatus
    reference: Optional[str]
    recorded_by: str
    recorded_at: datetime
    wallet_credit_used: float = 0.0

    class Config:
        from_attributes = True


class PaymentInfo(BaseModel):
    pot_id: UUID
    pot_name: str
    daily_amount: float
    currency: str
    days_paid: int
    buffer_days: int
    remaining_days: int
    max_days_payable: int
    wallet_balance: float
    wallet_currency: str