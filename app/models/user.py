"""
User models and session management
Pydantic models for user data, sessions, and WhatsApp interactions
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from dataclasses import dataclass
from enum import Enum


class SessionState(str, Enum):
    """User session states"""

    INIT = "init"
    AWAITING_PHONE = "awaiting_phone"
    AWAITING_OTP = "awaiting_otp"
    AUTHENTICATED = "authenticated"
    PROCESSING = "processing"
    ERROR = "error"


class UserState(str, Enum):
    """User state enum for database"""

    INITIAL = "initial"
    WAITING_FOR_OTP = "waiting_for_otp"  # Added missing state
    AWAITING_PHONE = "awaiting_phone"
    AWAITING_OTP = "awaiting_otp"
    AUTHENTICATED = "authenticated"
    PROCESSING = "processing"
    ERROR = "error"


class MessageType(str, Enum):
    """WhatsApp message types"""

    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    DOCUMENT = "document"
    LOCATION = "location"
    CONTACT = "contact"
    OTHER = "other"


@dataclass
class UserSession:
    """User session data"""

    user_id: str
    current_state: UserState  # Changed to UserState to match service
    created_at: datetime
    last_activity: datetime
    phone_number: Optional[str] = None
    bitsacco_user_id: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[str]] = None

    # Additional fields needed by service
    is_authenticated: bool = False
    otp_sent_at: Optional[datetime] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    def __post_init__(self):
        if self.context_data is None:
            self.context_data = {}
        if self.conversation_history is None:
            self.conversation_history = []

    def add_to_history(self, message: str, max_length: int = 10):
        """Add message to conversation history"""
        self.conversation_history.append(message)
        if len(self.conversation_history) > max_length:
            self.conversation_history = self.conversation_history[-max_length:]

    def is_expired(self, timeout_seconds: int) -> bool:
        """Check if session is expired"""
        now = datetime.utcnow()
        return (now - self.last_activity).total_seconds() > timeout_seconds

    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()


@dataclass
class MessageContext:
    """Context information for WhatsApp messages"""

    user_id: str
    message_type: MessageType
    timestamp: datetime
    phone_number: Optional[str] = None
    is_group: bool = False
    group_id: Optional[str] = None
    quoted_message_id: Optional[str] = None
    media_mime_type: Optional[str] = None
    media_size: Optional[int] = None


class UserProfile(BaseModel):
    """User profile information from Bitsacco"""

    user_id: str
    phone_number: str
    name: Optional[str] = None
    email: Optional[str] = None
    kyc_level: str = "basic"
    account_status: str = "active"
    created_at: datetime
    last_login: Optional[datetime] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)


class WalletBalance(BaseModel):
    """Wallet balance information"""

    user_id: str
    btc_balance: float = 0.0
    kes_balance: float = 0.0
    usd_balance: float = 0.0
    last_updated: datetime
    wallet_address: Optional[str] = None


class Transaction(BaseModel):
    """Transaction record"""

    id: str
    user_id: str
    type: str  # deposit, withdrawal, transfer, etc.
    amount_kes: Optional[float] = None
    amount_btc: Optional[float] = None
    status: str  # pending, completed, failed, cancelled
    created_at: datetime
    completed_at: Optional[datetime] = None
    description: str
    reference: Optional[str] = None
    blockchain_hash: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BitcoinPrice(BaseModel):
    """Bitcoin price information"""

    price_usd: float
    price_kes: float
    change_24h_usd: float
    change_24h_kes: float
    last_updated: datetime
    source: str = "coingecko"


class AIResponse(BaseModel):
    """AI conversation response"""

    success: bool
    response: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    suggested_actions: List[str] = Field(default_factory=list)
    context_updates: Dict[str, Any] = Field(default_factory=dict)


class APIResponse(BaseModel):
    """Generic API response wrapper"""

    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WebhookEvent(BaseModel):
    """Webhook event from external services"""

    event_type: str
    source: str
    timestamp: datetime
    data: Dict[str, Any]
    signature: Optional[str] = None


class ServiceHealth(BaseModel):
    """Service health status"""

    service_name: str
    status: str  # healthy, degraded, unhealthy
    last_check: datetime
    response_time_ms: Optional[float] = None
    error_message: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
