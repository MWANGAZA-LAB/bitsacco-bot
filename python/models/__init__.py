"""
Database models for Bitsacco Assistant
"""

from sqlalchemy import Column, String, DateTime, Decimal, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    phone_number = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    wallet_address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Transaction(Base):
    """Transaction model"""
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)  # send, receive
    amount_btc = Column(Decimal(precision=18, scale=8), nullable=False)
    amount_usd = Column(Decimal(precision=10, scale=2), nullable=True)
    amount_kes = Column(Decimal(precision=10, scale=2), nullable=True)
    recipient_address = Column(String, nullable=True)
    sender_address = Column(String, nullable=True)
    transaction_hash = Column(String, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Conversation(Base):
    """WhatsApp conversation model"""
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    message_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=True)
    intent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
