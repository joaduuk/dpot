from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SAEnum, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from app.core.database import Base


class ReconciliationStatus(str, enum.Enum):
    pending = "pending"
    complete = "complete"
    partial = "partial"
    overdue = "overdue"


class AgentCommissionStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"


class DailyReconciliation(Base):
    __tablename__ = "daily_reconciliations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    date = Column(Date, nullable=False)

    total_recorded = Column(Float, default=0.0)   # Sum of payments entered by agent
    total_transferred = Column(Float, default=0.0) # Amount platform received
    shortfall = Column(Float, default=0.0)         # total_recorded - total_transferred

    transfer_reference = Column(String, nullable=True)
    status = Column(SAEnum(ReconciliationStatus), default=ReconciliationStatus.pending)
    due_by = Column(DateTime, nullable=True)       # e.g. 8pm same day
    transferred_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    agent = relationship("Agent", back_populates="reconciliations")


class AgentCommission(Base):
    __tablename__ = "agent_commissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    pot_id = Column(UUID(as_uuid=True), ForeignKey("pots.id"), nullable=False)

    cycle_fee = Column(Float, nullable=False)       # 1 × daily_amount
    agent_share = Column(Float, nullable=False)     # 50% of cycle_fee
    platform_share = Column(Float, nullable=False)  # 50% of cycle_fee

    status = Column(SAEnum(AgentCommissionStatus), default=AgentCommissionStatus.pending)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    agent = relationship("Agent", back_populates="commissions")