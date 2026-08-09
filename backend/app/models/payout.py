from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.core.database import Base


class PayoutStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pot_id = Column(UUID(as_uuid=True), ForeignKey("pots.id"), nullable=False, unique=True)

    days_paid = Column(Integer, nullable=False)
    daily_amount = Column(Float, nullable=False)
    gross_amount = Column(Float, nullable=False)    # days_paid × daily_amount
    platform_fee = Column(Float, nullable=False)    # 1 × daily_amount (platform share)
    agent_commission = Column(Float, default=0.0)   # 0 if digital saver
    net_payout = Column(Float, nullable=False)      # gross - platform_fee - agent_commission

    method = Column(String, nullable=False)         # cash | mobile_money | bank_transfer
    mobile_money_number = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)

    status = Column(SAEnum(PayoutStatus), default=PayoutStatus.pending)
    requested_at = Column(DateTime, nullable=True)
    notice_given_at = Column(DateTime, nullable=True)
    eligible_at = Column(DateTime, nullable=True)   # notice_given_at + 24hrs
    completed_at = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    pot = relationship("Pot", back_populates="payout")