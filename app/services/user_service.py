"""
User Service - User management and authentication
Handles user sessions, authentication, and state management
"""

from typing import Dict, Any
from datetime import datetime, timedelta
import structlog

from ..models.user import UserSession, UserState
from ..services.bitsacco_api import BitsaccoAPIClient

logger = structlog.get_logger(__name__)


class UserService:
    """Production user service with session management"""

    def __init__(self, bitsacco_api: BitsaccoAPIClient):
        self.bitsacco_api = bitsacco_api
        self.user_sessions: Dict[str, UserSession] = {}
        self.is_running = False

        # Session settings
        self.session_timeout = timedelta(hours=24)
        self.otp_timeout = timedelta(minutes=5)

    async def start(self) -> None:
        """Start the user service"""
        try:
            self.is_running = True
            logger.info("✅ User service started")

        except Exception as e:
            logger.error("❌ Failed to start user service", error=str(e))
            raise

    async def stop(self) -> None:
        """Stop the user service"""
        self.is_running = False
        self.user_sessions.clear()
        logger.info("🛑 User service stopped")

    async def get_or_create_session(self, phone_number: str) -> UserSession:
        """Get existing session or create new one"""
        # Clean phone number
        phone_number = self._clean_phone_number(phone_number)

        # Check if session exists and is valid
        if phone_number in self.user_sessions:
            session = self.user_sessions[phone_number]

            # Check if session is expired
            if not self._is_session_expired(session):
                return session
            else:
                # Remove expired session
                del self.user_sessions[phone_number]

        # Create new session
        session = UserSession(
            user_id=phone_number,  # Use phone number as user_id
            phone_number=phone_number,
            current_state=UserState.INITIAL,
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
        )

        self.user_sessions[phone_number] = session

        logger.debug("Created new user session", user=phone_number)
        return session

    async def update_session(self, session: UserSession) -> None:
        """Update user session"""
        session.last_activity = datetime.utcnow()
        if session.phone_number:
            self.user_sessions[session.phone_number] = session

        logger.debug(
            "Updated user session",
            user=session.phone_number,
            state=session.current_state.value,
        )

    async def start_authentication(
        self, phone_number: str
    ) -> tuple[bool, str]:
        """Start phone number authentication process"""
        try:
            session = await self.get_or_create_session(phone_number)

            # Check if already authenticated
            if session.is_authenticated:
                return True, "You are already authenticated!"

            # Check user exists in Bitsacco
            user_data = await self.bitsacco_api.get_user_by_phone(phone_number)

            if not user_data:
                return (
                    False,
                    """
❌ Phone number not found in our system.

Please register at bitsacco.com first, then come back to use the bot.

🌐 Visit: https://bitsacco.com/register
                """.strip(),
                )

            # Send OTP
            otp_sent = await self.bitsacco_api.send_otp(phone_number)

            if otp_sent:
                # Update session state
                session.current_state = UserState.WAITING_FOR_OTP
                session.otp_sent_at = datetime.utcnow()
                session.first_name = user_data.get("first_name")
                session.last_name = user_data.get("last_name")

                await self.update_session(session)

                return (
                    True,
                    f"""
📱 *Verification Code Sent*

We've sent a 6-digit code to {phone_number}

Please reply with the code to verify your account.

_The code expires in 5 minutes_
                """.strip(),
                )
            else:
                return (
                    False,
                    "❌ Failed to send verification code. Please try again."
                )

        except Exception as e:
            logger.error(
                "Error starting authentication",
                user=phone_number,
                error=str(e),
            )
            return False, "❌ Authentication error. Please try again later."

    async def verify_otp(
        self, phone_number: str, otp_code: str
    ) -> tuple[bool, str]:
        """Verify OTP code"""
        try:
            session = await self.get_or_create_session(phone_number)

            # Check if user is in correct state
            if session.current_state != UserState.WAITING_FOR_OTP:
                return (
                    False,
                    "❌ No verification in progress. "
                    "Type 'start' to begin."
                )

            # Check OTP timeout
            if session.otp_sent_at:
                otp_age = datetime.utcnow() - session.otp_sent_at
                if otp_age > self.otp_timeout:
                    session.current_state = UserState.INITIAL
                    await self.update_session(session)
                    return (
                        False,
                        (
                            "❌ Verification code expired. "
                            "Type 'start' to get a new code."
                        ),
                    )

            # Verify OTP with Bitsacco API
            is_valid = await self.bitsacco_api.verify_otp(
                phone_number, otp_code
            )

            if is_valid:
                # Authentication successful
                session.is_authenticated = True
                session.current_state = UserState.AUTHENTICATED
                # Field doesn't exist: session.authenticated_at

                await self.update_session(session)

                return (
                    True,
                    f"""
✅ *Verification Successful!*

Welcome to Bitsacco, {session.first_name or 'friend'}!

Your account is now connected. You can now:
• Check Bitcoin prices
• View your savings balance
• Start new savings
• Track your investments

Type 'help' to see all available commands.
                """.strip(),
                )
            else:
                return False, "❌ Invalid verification code. Please try again."

        except Exception as e:
            logger.error(
                "Error verifying OTP",
                user=phone_number,
                error=str(e)
            )
            return False, "❌ Verification error. Please try again."

    async def logout_user(self, phone_number: str) -> str:
        """Logout user and clear session"""
        phone_number = self._clean_phone_number(phone_number)

        if phone_number in self.user_sessions:
            del self.user_sessions[phone_number]

        logger.debug("User logged out", user=phone_number)

        return """
👋 *Logged Out Successfully*

Your session has been cleared for security.

To use Bitsacco again, type 'start' to authenticate.

Thank you for using Bitsacco!
        """.strip()

    async def get_user_profile(self, phone_number: str) -> str:
        """Get user profile information"""
        try:
            session = await self.get_or_create_session(phone_number)

            if not session.is_authenticated:
                return "❌ Please authenticate first. Type 'start' to begin."

            # Get fresh user data from API
            user_data = await self.bitsacco_api.get_user_by_phone(phone_number)

            if user_data:
                profile_info = f"""
👤 *Your Bitsacco Profile*

📛 Name: {user_data.get('first_name', '')} {user_data.get('last_name', '')}
📱 Phone: {phone_number}
📅 Member since: {user_data.get('created_at', 'Unknown')}
✅ Status: Verified

_Keep your account secure and never share your verification codes!_
                """.strip()

                return profile_info
            else:
                return (
                    "❌ Unable to fetch profile information. "
                    "Please try again."
                )

        except Exception as e:
            logger.error(
                "Error getting user profile",
                user=phone_number,
                error=str(e)
            )
            return "❌ Error fetching profile. Please try again."

    async def health_check(self) -> Dict[str, Any]:
        """Health check for monitoring"""
        active_sessions = len(self.user_sessions)
        authenticated_sessions = sum(
            1
            for session in self.user_sessions.values()
            if session.is_authenticated
        )

        return {
            "status": "healthy" if self.is_running else "unhealthy",
            "is_running": self.is_running,
            "active_sessions": active_sessions,
            "authenticated_sessions": authenticated_sessions,
        }

    def _clean_phone_number(self, phone_number: str) -> str:
        """Clean and normalize phone number"""
        # Remove all non-digit characters
        digits_only = "".join(filter(str.isdigit, phone_number))

        # Handle Kenyan numbers
        if digits_only.startswith("254"):
            return f"+{digits_only}"
        elif digits_only.startswith("0") and len(digits_only) == 10:
            return f"+254{digits_only[1:]}"
        elif len(digits_only) == 9:
            return f"+254{digits_only}"
        else:
            return f"+{digits_only}"

    def _is_session_expired(self, session: UserSession) -> bool:
        """Check if session is expired"""
        if not session.last_activity:
            return True

        age = datetime.utcnow() - session.last_activity
        return age > self.session_timeout
