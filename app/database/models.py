"""
Database Models - SQLAlchemy models for persistent storage
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    Float,
    Integer,
    Text,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

from ..models.user import UserState

# Proper type annotation for SQLAlchemy Base
Base: Any = declarative_base()


class UserSessionModel(Base):
    """Database model for user sessions"""

    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))

    # Authentication
    is_authenticated = Column(Boolean, default=False)
    current_state: Column[UserState] = Column(
        SQLEnum(UserState), default=UserState.INITIAL
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    authenticated_at = Column(DateTime)
    otp_sent_at = Column(DateTime)

    # Relationships
    messages = relationship("MessageHistoryModel", back_populates="user_session")
    transactions = relationship("TransactionModel", back_populates="user_session")


class MessageHistoryModel(Base):
    """Database model for message history"""

    __tablename__ = "message_history"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), ForeignKey("user_sessions.phone_number"))

    # Message content
    message_text = Column(Text, nullable=False)
    message_type = Column(String(20))  # incoming, outgoing, system

    # Processing info
    intent = Column(String(50))
    confidence = Column(Float)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    # Relationships
    user_session = relationship("UserSessionModel", back_populates="messages")


class TransactionModel(Base):
    """Database model for transaction tracking"""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), ForeignKey("user_sessions.phone_number"))

    # Transaction details
    transaction_id = Column(String(100), unique=True, index=True)
    transaction_type = Column(String(20))  # savings, withdrawal, etc.
    amount_kes = Column(Float, nullable=False)
    amount_btc = Column(Float)

    # Status
    status = Column(String(20))  # pending, completed, failed

    # Bitsacco API response
    bitsacco_response = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Relationships
    user_session = relationship("UserSessionModel", back_populates="transactions")


class BitcoinPriceModel(Base):
    """Database model for Bitcoin price history"""

    __tablename__ = "bitcoin_prices"

    id = Column(Integer, primary_key=True, index=True)

    # Price data
    price_usd = Column(Float, nullable=False)
    price_kes = Column(Float, nullable=False)
    change_24h_usd = Column(Float)
    change_24h_kes = Column(Float)

    # Source and timestamp
    source = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class SystemLogModel(Base):
    """Database model for system logs and monitoring"""

    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Log details
    level = Column(String(20))  # INFO, WARNING, ERROR, DEBUG
    message = Column(Text, nullable=False)
    module = Column(String(100))

    # Context
    user_phone = Column(String(20))
    session_id = Column(String(100))

    # Additional data
    extra_data = Column(Text)  # JSON string for additional context

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class WebhookLogModel(Base):
    """Database model for webhook request logging"""

    __tablename__ = "webhook_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Request details
    method = Column(String(10))
    url = Column(String(500))
    headers = Column(Text)
    body = Column(Text)

    # Response details
    status_code = Column(Integer)
    response_body = Column(Text)

    # Timing
    duration_ms = Column(Float)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
