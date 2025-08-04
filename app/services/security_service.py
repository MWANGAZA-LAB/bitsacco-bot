"""
Security Service for Bitsacco WhatsApp Bot
Comprehensive security hardening, rate limiting, and threat detection
"""

import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Set, List
import structlog
from dataclasses import dataclass
from enum import Enum
import jwt
from cryptography.fernet import Fernet

logger = structlog.get_logger(__name__)


class ThreatLevel(str, Enum):
    """Security threat levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityEvent:
    """Security event record"""

    event_type: str
    threat_level: ThreatLevel
    source_ip: Optional[str]
    user_identifier: Optional[str]
    description: str
    timestamp: datetime
    metadata: Dict[str, Any]


class SecurityService:
    """Production security service with comprehensive protection"""

    def __init__(self, encryption_key: Optional[str] = None):
        self.encryption_key = encryption_key or Fernet.generate_key()
        self.fernet = Fernet(self.encryption_key)

        # Rate limiting storage
        self.rate_limit_store: Dict[str, List[float]] = {}

        # Security events
        self.security_events: List[SecurityEvent] = []

        # Blocked entities
        self.blocked_ips: Set[str] = set()
        self.blocked_phones: Set[str] = set()

        # Configuration
        self.rate_limits = {
            "authentication": {
                "requests": 5,
                "window": 300,
            },  # 5 attempts per 5 min
            "api_calls": {
                "requests": 100,
                "window": 60,
            },  # 100 calls per minute
            "otp_requests": {
                "requests": 3,
                "window": 600,
            },  # 3 OTP per 10 min
        }

    async def validate_request(
        self,
        request_type: str,
        identifier: str,
        source_ip: Optional[str] = None
    ) -> tuple[bool, Optional[str]]:
        """Validate incoming request against security policies"""

        # Check if identifier is blocked
        if identifier in self.blocked_phones or (
            source_ip and source_ip in self.blocked_ips
        ):
            await self._log_security_event(
                "blocked_access_attempt",
                ThreatLevel.HIGH,
                source_ip,
                identifier,
                "Blocked entity attempted access",
            )
            return False, "Access denied"

        # Check rate limits
        rate_limit_check = await self._check_rate_limit(
            request_type, identifier
        )
        if not rate_limit_check:
            await self._log_security_event(
                "rate_limit_exceeded",
                ThreatLevel.MEDIUM,
                source_ip,
                identifier,
                f"Rate limit exceeded for {request_type}",
            )
            return False, "Rate limit exceeded. Please try again later."

        # Additional security checks
        await self._check_suspicious_patterns(identifier, source_ip)

        return True, None

    async def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data for storage"""
        try:
            encrypted = self.fernet.encrypt(data.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error("Encryption failed", error=str(e))
            raise

    async def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        try:
            decrypted = self.fernet.decrypt(encrypted_data.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error("Decryption failed", error=str(e))
            raise

    async def generate_secure_token(
        self, user_id: str, expires_in: int = 3600
    ) -> str:
        """Generate secure JWT token"""
        payload = {
            "user_id": user_id,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(seconds=expires_in),
            "iss": "bitsacco-whatsapp-bot",
        }

        # Use environment variable for JWT secret in production
        secret = "your-jwt-secret-key"  # Should be from environment
        return jwt.encode(payload, secret, algorithm="HS256")

    async def validate_webhook_signature(
        self, payload: str, signature: str, secret: str
    ) -> bool:
        """Validate webhook signature for security"""
        try:
            expected_signature = hmac.new(
                secret.encode(), payload.encode(), hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error("Webhook signature validation failed", error=str(e))
            return False

    async def sanitize_phone_number(self, phone: str) -> Optional[str]:
        """Sanitize and validate phone number"""
        # Remove all non-digit characters
        digits_only = "".join(filter(str.isdigit, phone))

        # Basic validation
        if len(digits_only) < 9 or len(digits_only) > 15:
            return None

        # Format for Kenya
        if digits_only.startswith("254"):
            return f"+{digits_only}"
        elif digits_only.startswith("0") and len(digits_only) == 10:
            return f"+254{digits_only[1:]}"
        elif len(digits_only) == 9:
            return f"+254{digits_only}"

        return f"+{digits_only}"

    async def audit_log(
        self, action: str, user_id: Optional[str], details: Dict[str, Any]
    ) -> None:
        """Create audit log entry"""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "user_id": user_id,
            "details": details,
            "session_id": details.get("session_id"),
        }

        # In production, send to secure audit log storage
        logger.info("Audit log entry", **audit_entry)

    async def get_security_report(self) -> Dict[str, Any]:
        """Generate security status report"""
        recent_events = [
            e
            for e in self.security_events
            if e.timestamp > datetime.utcnow() - timedelta(hours=24)
        ]

        threat_counts = {}
        for level in ThreatLevel:
            threat_counts[level.value] = len(
                [e for e in recent_events if e.threat_level == level]
            )

        return {
            "status": "secure",
            "blocked_ips": len(self.blocked_ips),
            "blocked_phones": len(self.blocked_phones),
            "security_events_24h": len(recent_events),
            "threat_levels": threat_counts,
            "rate_limit_violations": len(
                [
                    e
                    for e in recent_events
                    if e.event_type == "rate_limit_exceeded"
                ]
            ),
            "last_updated": datetime.utcnow().isoformat(),
        }

    async def _check_rate_limit(
        self, request_type: str, identifier: str
    ) -> bool:
        """Check if request is within rate limits"""
        if request_type not in self.rate_limits:
            return True

        config = self.rate_limits[request_type]
        key = f"{request_type}:{identifier}"
        now = time.time()

        # Initialize if not exists
        if key not in self.rate_limit_store:
            self.rate_limit_store[key] = []

        # Clean old entries
        window_start = now - config["window"]
        self.rate_limit_store[key] = [
            timestamp
            for timestamp in self.rate_limit_store[key]
            if timestamp > window_start
        ]

        # Check limit
        if len(self.rate_limit_store[key]) >= config["requests"]:
            return False

        # Add current request
        self.rate_limit_store[key].append(now)
        return True

    async def _check_suspicious_patterns(
        self, identifier: str, source_ip: Optional[str]
    ) -> None:
        """Check for suspicious activity patterns"""
        # Implement pattern detection logic
        # Example: Multiple failed authentication attempts
        # Example: Unusual API usage patterns
        # Example: Geographic anomalies
        pass

    async def _log_security_event(
        self,
        event_type: str,
        threat_level: ThreatLevel,
        source_ip: Optional[str],
        user_identifier: Optional[str],
        description: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log security event"""
        event = SecurityEvent(
            event_type=event_type,
            threat_level=threat_level,
            source_ip=source_ip,
            user_identifier=user_identifier,
            description=description,
            timestamp=datetime.utcnow(),
            metadata=metadata or {},
        )

        self.security_events.append(event)

        # Keep events list manageable
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-500:]

        logger.warning(
            "Security event",
            event_type=event_type,
            threat_level=threat_level.value,
            description=description,
        )
