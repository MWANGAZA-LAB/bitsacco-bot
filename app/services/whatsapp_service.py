"""
WhatsApp Service - Production-ready WhatsApp integration
Handles message processing, user sessions, and bot interactions
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
import structlog

from ..config import settings
from ..models.user import UserSession, MessageContext
from .bitsacco_api import BitsaccoAPIClient
from .ai_service import AIConversationService
from .user_service import UserService
from .simple_bitcoin_service import SimpleBitcoinPriceService

logger = structlog.get_logger(__name__)


@dataclass
class WhatsAppMessage:
    """WhatsApp message structure"""

    id: str
    sender: str
    content: str
    timestamp: datetime
    message_type: str = "text"
    media_url: Optional[str] = None
    quoted_message: Optional[str] = None


class WhatsAppService:
    """Production WhatsApp service with Selenium WebDriver"""

    def __init__(
        self,
        bitsacco_api: BitsaccoAPIClient,
        ai_service: AIConversationService,
        user_service: UserService,
        bitcoin_service: SimpleBitcoinPriceService,
    ):
        self.bitsacco_api = bitsacco_api
        self.ai_service = ai_service
        self.user_service = user_service
        self.bitcoin_service = bitcoin_service

        self.driver: Optional[webdriver.Chrome] = None
        self.is_ready = False
        self.is_running = False
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.user_sessions: Dict[str, UserSession] = {}

        # Performance metrics
        self.stats = {
            "messages_processed": 0,
            "messages_sent": 0,
            "active_sessions": 0,
            "errors": 0,
            "start_time": None,
        }

    async def initialize(self) -> None:
        """Initialize WhatsApp Web with Selenium"""
        try:
            logger.info("🚀 Initializing WhatsApp service")

            # Setup Chrome options
            chrome_options = Options()
            if settings.WHATSAPP_HEADLESS:
                chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument(
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )

            # User data directory for session persistence
            user_data_dir = settings.DATA_DIR / "whatsapp-session"
            user_data_dir.mkdir(exist_ok=True)
            chrome_options.add_argument(f"--user-data-dir={user_data_dir}")

            # Initialize driver
            self.driver = webdriver.Chrome(
                service=webdriver.chrome.service.Service(
                    ChromeDriverManager().install()
                ),
                options=chrome_options,
            )

            # Navigate to WhatsApp Web
            self.driver.get("https://web.whatsapp.com")
            logger.info("📱 WhatsApp Web loaded")

            # Wait for QR code or login
            await self._wait_for_login()

            # Start message processing
            self.is_ready = True
            self.is_running = True
            self.stats["start_time"] = datetime.utcnow()

            # Start background tasks
            asyncio.create_task(self._message_processor())
            asyncio.create_task(self._session_cleanup_task())
            asyncio.create_task(self._health_monitor())

            logger.info("✅ WhatsApp service initialized successfully")

        except Exception as e:
            logger.error("❌ Failed to initialize WhatsApp service", error=str(e))
            await self.stop()
            raise

    async def _wait_for_login(self) -> None:
        """Wait for WhatsApp login (QR code scan or existing session)"""
        logger.info("⏳ Waiting for WhatsApp login...")

        wait = WebDriverWait(self.driver, settings.WHATSAPP_TIMEOUT)

        try:
            # Check if already logged in
            wait.until(
                EC.any_of(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, "[data-testid='chat-list']")
                    ),
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, "canvas[aria-label='Scan me!']")
                    ),
                )
            )

            # If QR code is present, inform user
            qr_elements = self.driver.find_elements(
                By.CSS_SELECTOR, "canvas[aria-label='Scan me!']"
            )
            if qr_elements:
                logger.info("📱 Please scan the QR code in WhatsApp Web to continue")

                # Wait for login completion
                wait.until(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, "[data-testid='chat-list']")
                    )
                )

            logger.info("✅ WhatsApp login successful")

        except TimeoutException:
            logger.error("❌ WhatsApp login timeout")
            raise

    async def _message_processor(self) -> None:
        """Background task to process incoming messages"""
        logger.info("🔄 Starting message processor")

        last_message_check = time.time()
        processed_messages = set()

        while self.is_running:
            try:
                await asyncio.sleep(1)  # Check every second

                # Get unread messages
                messages = self._get_unread_messages()

                for message in messages:
                    if message.id not in processed_messages:
                        await self._handle_message(message)
                        processed_messages.add(message.id)
                        self.stats["messages_processed"] += 1

                # Cleanup old processed message IDs (keep last 1000)
                if len(processed_messages) > 1000:
                    processed_messages = set(list(processed_messages)[-500:])

                # Update session stats
                self.stats["active_sessions"] = len(self.user_sessions)

            except Exception as e:
                logger.error("Error in message processor", error=str(e))
                self.stats["errors"] += 1
                await asyncio.sleep(5)  # Back off on error

    def _get_unread_messages(self) -> List[WhatsAppMessage]:
        """Extract unread messages from WhatsApp Web"""
        messages = []

        try:
            # Find unread chat elements
            unread_chats = self.driver.find_elements(
                By.CSS_SELECTOR,
                "[data-testid='cell-frame-container'] [data-testid='unread-count']",
            )

            for chat_element in unread_chats[:5]:  # Limit to 5 chats at a time
                try:
                    # Click on chat to open
                    chat_container = chat_element.find_element(By.XPATH, "../../..")
                    chat_container.click()
                    time.sleep(0.5)  # Use time.sleep for sync function

                    # Get messages from this chat
                    chat_messages = self._extract_chat_messages()
                    messages.extend(chat_messages)

                except Exception as e:
                    logger.debug("Error processing chat", error=str(e))
                    continue

        except Exception as e:
            logger.debug("Error getting unread messages", error=str(e))

        return messages

    def _extract_chat_messages(self) -> List[WhatsAppMessage]:
        """Extract messages from currently open chat"""
        messages = []

        try:
            # Get chat info
            chat_header = self.driver.find_element(
                By.CSS_SELECTOR, "[data-testid='conversation-header']"
            )
            chat_name = chat_header.find_element(
                By.CSS_SELECTOR, "[data-testid='conversation-info-header-chat-title']"
            ).text

            # Skip group chats for now
            if "participants" in chat_name.lower() or len(chat_name.split()) > 2:
                return messages

            # Get recent messages
            message_elements = self.driver.find_elements(
                By.CSS_SELECTOR, "[data-testid='msg-container']"
            )

            # Process last 5 messages
            for msg_element in message_elements[-5:]:
                try:
                    message = self._parse_message_element(msg_element, chat_name)
                    if message and not self._is_own_message(msg_element):
                        messages.append(message)
                except Exception as e:
                    logger.debug("Error parsing message", error=str(e))
                    continue

        except Exception as e:
            logger.debug("Error extracting chat messages", error=str(e))

        return messages

    def _parse_message_element(
        self, element, chat_name: str
    ) -> Optional[WhatsAppMessage]:
        """Parse individual message element"""
        try:
            # Get message text
            text_elements = element.find_elements(
                By.CSS_SELECTOR, "[data-testid='conversation-text']"
            )
            if not text_elements:
                return None

            content = text_elements[0].text.strip()
            if not content:
                return None

            # Get timestamp
            time_elements = element.find_elements(
                By.CSS_SELECTOR, "[data-testid='msg-meta'] span"
            )
            timestamp_str = (
                time_elements[0].text
                if time_elements
                else datetime.utcnow().strftime("%H:%M")
            )

            # Generate message ID
            message_id = f"{chat_name}_{hash(content)}_{timestamp_str}"

            return WhatsAppMessage(
                id=message_id,
                sender=chat_name,
                content=content,
                timestamp=datetime.utcnow(),
                message_type="text",
            )

        except Exception as e:
            logger.debug("Error parsing message element", error=str(e))
            return None

    def _is_own_message(self, element) -> bool:
        """Check if message is sent by us"""
        try:
            # Messages we sent have different styling
            outgoing_indicators = element.find_elements(
                By.CSS_SELECTOR, "[data-testid='msg-meta'] [data-icon='msg-check']"
            )
            return len(outgoing_indicators) > 0
        except:
            return False

    async def _handle_message(self, message: WhatsAppMessage) -> None:
        """Process incoming WhatsApp message"""
        try:
            logger.info(
                "📨 Processing message",
                sender=self._mask_phone(message.sender),
                content_length=len(message.content),
            )

            # Get or create user session
            session = await self._get_user_session(message.sender)

            # Create message context
            context = MessageContext(
                user_id=message.sender,
                phone_number=self._extract_phone_number(message.sender),
                message_type=message.message_type,
                timestamp=message.timestamp,
                is_group=False,
            )

            # Process message based on session state
            if session.state == "init" or message.content.lower() in [
                "/start",
                "hi",
                "hello",
                "mambo",
            ]:
                await self._handle_welcome(message.sender, session)
            elif session.state == "awaiting_phone":
                await self._handle_phone_input(message.sender, message.content, session)
            elif session.state == "awaiting_otp":
                await self._handle_otp_input(message.sender, message.content, session)
            elif session.state == "authenticated":
                await self._handle_authenticated_message(
                    message.sender, message.content, session, context
                )
            else:
                await self._send_help_message(message.sender)

            # Update session
            session.last_activity = datetime.utcnow()
            self.user_sessions[message.sender] = session

        except Exception as e:
            logger.error("Error handling message", error=str(e), sender=message.sender)
            await self._send_error_message(message.sender)

    async def _get_user_session(self, user_id: str) -> UserSession:
        """Get or create user session"""
        if user_id not in self.user_sessions:
            # Try to load from database
            db_session = await self.user_service.get_session(user_id)
            if db_session:
                self.user_sessions[user_id] = db_session
            else:
                self.user_sessions[user_id] = UserSession(
                    user_id=user_id,
                    state="init",
                    created_at=datetime.utcnow(),
                    last_activity=datetime.utcnow(),
                )

        return self.user_sessions[user_id]

    async def _handle_welcome(self, user_id: str, session: UserSession) -> None:
        """Handle welcome message and phone number request"""
        welcome_msg = """
🏦 *Welcome to Bitsacco SACCO!*

Save money in Bitcoin through M-Pesa 💰₿

To get started, please share your phone number (e.g., +254700123456)

_Your phone number must be registered with Bitsacco.com_
        """.strip()

        await self._send_message(user_id, welcome_msg)
        session.state = "awaiting_phone"

    async def _handle_phone_input(
        self, user_id: str, phone: str, session: UserSession
    ) -> None:
        """Handle phone number input and OTP request"""
        # Normalize phone number
        normalized_phone = self._normalize_phone_number(phone)

        if not self._is_valid_phone_number(normalized_phone):
            await self._send_message(
                user_id,
                "❌ Please enter a valid phone number with country code (e.g., +254700123456)",
            )
            return

        try:
            # Check user exists in Bitsacco
            user_data = await self.bitsacco_api.get_user_by_phone(normalized_phone)

            if not user_data.get("exists", True):
                await self._send_message(
                    user_id,
                    f"❌ No Bitsacco account found for {normalized_phone}.\n\nPlease register at https://bitsacco.com first.",
                )
                return

            # Send OTP
            otp_result = await self.bitsacco_api.send_otp(normalized_phone)

            if otp_result.get("success"):
                await self._send_message(
                    user_id,
                    f"📱 OTP sent to {normalized_phone}\n\nPlease enter the 6-digit code:",
                )
                session.state = "awaiting_otp"
                session.phone_number = normalized_phone
            else:
                await self._send_message(
                    user_id, "❌ Failed to send OTP. Please try again."
                )

        except Exception as e:
            logger.error("Error in phone input handling", error=str(e))
            await self._send_message(
                user_id, "❌ Error verifying phone number. Please try again."
            )

    async def _handle_otp_input(
        self, user_id: str, otp: str, session: UserSession
    ) -> None:
        """Handle OTP verification"""
        # Extract digits only
        otp_digits = "".join(filter(str.isdigit, otp))

        if len(otp_digits) != 6:
            await self._send_message(user_id, "❌ Please enter a valid 6-digit OTP")
            return

        try:
            # Verify OTP with Bitsacco
            verify_result = await self.bitsacco_api.verify_otp(
                session.phone_number, otp_digits
            )

            if verify_result.get("success"):
                session.state = "authenticated"
                session.bitsacco_user_id = verify_result.get("user_id")

                # Save session to database
                await self.user_service.save_session(session)

                # Send welcome message
                welcome_msg = """
✅ *Authentication successful!*

You can now:
• *balance* - Check your Bitcoin savings
• *save 1000* - Save 1000 KES in Bitcoin
• *history* - View transaction history
• *price* - Current Bitcoin price
• *help* - See all commands

What would you like to do?
                """.strip()

                await self._send_message(user_id, welcome_msg)
            else:
                await self._send_message(user_id, "❌ Invalid OTP. Please try again.")

        except Exception as e:
            logger.error("Error in OTP verification", error=str(e))
            await self._send_message(
                user_id, "❌ Error verifying OTP. Please try again."
            )

    async def _handle_authenticated_message(
        self, user_id: str, content: str, session: UserSession, context: MessageContext
    ) -> None:
        """Handle messages from authenticated users"""
        content_lower = content.lower().strip()

        try:
            # Check for specific commands
            if content_lower == "balance":
                await self._handle_balance_command(user_id, session)
            elif content_lower.startswith("save "):
                await self._handle_save_command(user_id, content, session)
            elif content_lower == "history":
                await self._handle_history_command(user_id, session)
            elif content_lower == "price":
                await self._handle_price_command(user_id)
            elif content_lower == "help":
                await self._send_help_message(user_id)
            else:
                # Use AI for natural language processing
                await self._handle_ai_conversation(user_id, content, session, context)

        except Exception as e:
            logger.error("Error in authenticated message handling", error=str(e))
            await self._send_error_message(user_id)

    async def _handle_balance_command(self, user_id: str, session: UserSession) -> None:
        """Handle balance inquiry"""
        try:
            balance_data = await self.bitsacco_api.get_balance(session.bitsacco_user_id)

            if balance_data.get("success"):
                btc_balance = balance_data.get("btc_balance", 0)
                kes_balance = balance_data.get("kes_balance", 0)

                # Get current Bitcoin price
                btc_price_usd = await self.bitcoin_service.get_current_price("usd")
                # Convert to KES (simplified - use fixed rate or implement conversion)
                btc_price_kes = (
                    btc_price_usd * 130 if btc_price_usd else 0
                )  # Approx USD to KES
                btc_value_kes = btc_balance * btc_price_kes if btc_price_kes else 0

                balance_msg = f"""
💰 *Your Bitsacco Balance*

₿ Bitcoin: {btc_balance:.8f} BTC
💵 KES Value: KES {btc_value_kes:,.2f}
💴 KES Cash: KES {kes_balance:,.2f}

📈 Current BTC Price: KES {btc_price_kes:,.2f}
                """.strip()

                await self._send_message(user_id, balance_msg)
            else:
                await self._send_message(
                    user_id, "❌ Unable to fetch balance. Please try again."
                )

        except Exception as e:
            logger.error("Error fetching balance", error=str(e))
            await self._send_message(
                user_id, "❌ Error fetching balance. Please try again."
            )

    async def _handle_save_command(
        self, user_id: str, content: str, session: UserSession
    ) -> None:
        """Handle Bitcoin savings command"""
        try:
            # Extract amount
            amount_str = content.lower().replace("save", "").strip()
            amount = float(
                "".join(filter(lambda x: x.isdigit() or x == ".", amount_str))
            )

            if amount < 100:
                await self._send_message(
                    user_id, "❌ Minimum savings amount is KES 100"
                )
                return

            if amount > 50000:
                await self._send_message(
                    user_id, "❌ Maximum single savings amount is KES 50,000"
                )
                return

            # Initiate Bitcoin savings
            save_result = await self.bitsacco_api.initiate_bitcoin_savings(
                session.phone_number, amount
            )

            if save_result.get("success"):
                transaction_id = save_result.get("transaction_id")

                save_msg = f"""
✅ *Bitcoin Savings Initiated*

💰 Amount: KES {amount:,.2f}
📱 M-Pesa prompt sent to {session.phone_number}
🆔 Transaction ID: {transaction_id}

Please complete the M-Pesa payment to confirm your Bitcoin savings.
                """.strip()

                await self._send_message(user_id, save_msg)
            else:
                await self._send_message(
                    user_id,
                    f"❌ {save_result.get('message', 'Failed to initiate savings')}",
                )

        except ValueError:
            await self._send_message(
                user_id, "❌ Please enter a valid amount (e.g., 'save 1000')"
            )
        except Exception as e:
            logger.error("Error in save command", error=str(e))
            await self._send_message(user_id, "❌ Error processing savings request.")

    async def _handle_history_command(self, user_id: str, session: UserSession) -> None:
        """Handle transaction history request"""
        try:
            history_data = await self.bitsacco_api.get_transaction_history(
                session.bitsacco_user_id
            )

            if history_data.get("success") and history_data.get("transactions"):
                transactions = history_data["transactions"][:5]  # Last 5 transactions

                history_msg = "📊 *Recent Transactions*\n\n"

                for tx in transactions:
                    emoji = "💰" if tx["type"] == "deposit" else "💸"
                    date = tx["date"][:10]  # YYYY-MM-DD
                    history_msg += f"{emoji} {tx['type'].title()}\n"
                    history_msg += f"   Amount: {tx['amount']} {tx['currency']}\n"
                    history_msg += f"   Date: {date}\n"
                    history_msg += f"   Status: {tx['status']}\n\n"

                await self._send_message(user_id, history_msg.strip())
            else:
                await self._send_message(user_id, "📊 No recent transactions found.")

        except Exception as e:
            logger.error("Error fetching history", error=str(e))
            await self._send_message(user_id, "❌ Error fetching transaction history.")

    async def _handle_price_command(self, user_id: str) -> None:
        """Handle Bitcoin price request"""
        try:
            price = await self.bitcoin_service.get_current_price("usd")
            price_message = self.bitcoin_service.format_price(price)
            await self._send_message(user_id, price_message)
        except Exception as e:
            logger.error("Error fetching price", error=str(e))
            await self._send_message(user_id, "❌ Error fetching Bitcoin price.")

    async def _handle_ai_conversation(
        self, user_id: str, content: str, session: UserSession, context: MessageContext
    ) -> None:
        """Handle AI-powered conversation"""
        try:
            if self.ai_service:
                ai_response = await self.ai_service.process_message(
                    user_id, session.phone_number, content, context
                )

                if ai_response.get("success"):
                    await self._send_message(user_id, ai_response["response"])
                else:
                    await self._send_help_message(user_id)
            else:
                await self._send_help_message(user_id)

        except Exception as e:
            logger.error("Error in AI conversation", error=str(e))
            await self._send_help_message(user_id)

    async def _send_message(self, user_id: str, message: str) -> None:
        """Send message to WhatsApp user"""
        try:
            # Find and open chat
            search_box = self.driver.find_element(
                By.CSS_SELECTOR, "[data-testid='chat-list-search']"
            )
            search_box.clear()
            search_box.send_keys(user_id)
            await asyncio.sleep(1)

            # Click on first chat result
            chat_result = self.driver.find_element(
                By.CSS_SELECTOR, "[data-testid='cell-frame-container']"
            )
            chat_result.click()
            await asyncio.sleep(0.5)

            # Type message
            message_box = self.driver.find_element(
                By.CSS_SELECTOR, "[data-testid='conversation-compose-box-input']"
            )
            message_box.clear()

            # Handle multi-line messages
            lines = message.split("\n")
            for i, line in enumerate(lines):
                message_box.send_keys(line)
                if i < len(lines) - 1:
                    message_box.send_keys(
                        webdriver.common.keys.Keys.SHIFT
                        + webdriver.common.keys.Keys.ENTER
                    )

            # Send message
            send_button = self.driver.find_element(
                By.CSS_SELECTOR, "[data-testid='send']"
            )
            send_button.click()

            self.stats["messages_sent"] += 1
            logger.debug("📤 Message sent", recipient=self._mask_phone(user_id))

        except Exception as e:
            logger.error("Error sending message", error=str(e), recipient=user_id)
            raise

    async def _send_help_message(self, user_id: str) -> None:
        """Send help message with available commands"""
        help_msg = """
🏦 *Bitsacco Commands*

• *balance* - Check your Bitcoin savings
• *save [amount]* - Save KES in Bitcoin (e.g., "save 1000")
• *history* - View recent transactions
• *price* - Current Bitcoin price
• *help* - Show this help

You can also ask me questions in natural language!

Example: "How much Bitcoin do I have?" or "I want to save 500 shillings"
        """.strip()

        await self._send_message(user_id, help_msg)

    async def _send_error_message(self, user_id: str) -> None:
        """Send generic error message"""
        error_msg = "❌ Sorry, something went wrong. Please try again or type 'help' for assistance."
        await self._send_message(user_id, error_msg)

    def _normalize_phone_number(self, phone: str) -> str:
        """Normalize phone number to international format"""
        # Remove all non-digits
        digits = "".join(filter(str.isdigit, phone))

        # Handle Kenyan numbers
        if digits.startswith("254"):
            return f"+{digits}"
        elif digits.startswith("0") and len(digits) == 10:
            return f"+254{digits[1:]}"
        elif len(digits) == 9:
            return f"+254{digits}"
        else:
            return f"+{digits}"

    def _is_valid_phone_number(self, phone: str) -> bool:
        """Validate phone number format"""
        if not phone.startswith("+"):
            return False

        digits = phone[1:]
        return digits.isdigit() and 10 <= len(digits) <= 15

    def _extract_phone_number(self, chat_name: str) -> Optional[str]:
        """Extract phone number from chat name if possible"""
        # WhatsApp shows phone numbers for unsaved contacts
        if "+" in chat_name and any(c.isdigit() for c in chat_name):
            return self._normalize_phone_number(chat_name)
        return None

    def _mask_phone(self, phone: str) -> str:
        """Mask phone number for privacy in logs"""
        if len(phone) > 6:
            return f"{phone[:3]}****{phone[-3:]}"
        return "****"

    async def _session_cleanup_task(self) -> None:
        """Background task to clean up inactive sessions"""
        while self.is_running:
            try:
                current_time = datetime.utcnow()
                timeout_threshold = current_time - timedelta(
                    seconds=settings.SESSION_TIMEOUT
                )

                # Remove expired sessions
                expired_sessions = [
                    user_id
                    for user_id, session in self.user_sessions.items()
                    if session.last_activity < timeout_threshold
                ]

                for user_id in expired_sessions:
                    del self.user_sessions[user_id]

                if expired_sessions:
                    logger.info(
                        f"🧹 Cleaned up {len(expired_sessions)} expired sessions"
                    )

                await asyncio.sleep(settings.SESSION_CLEANUP_INTERVAL)

            except Exception as e:
                logger.error("Error in session cleanup", error=str(e))
                await asyncio.sleep(60)

    async def _health_monitor(self) -> None:
        """Monitor WhatsApp connection health"""
        while self.is_running:
            try:
                # Check if WhatsApp Web is still responsive
                if self.driver:
                    # Try to find chat list to verify connection
                    chat_list = self.driver.find_elements(
                        By.CSS_SELECTOR, "[data-testid='chat-list']"
                    )
                    if not chat_list:
                        logger.warning("⚠️ WhatsApp Web connection may be lost")

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                logger.error("Error in health monitor", error=str(e))
                await asyncio.sleep(60)

    async def health_check(self) -> Dict[str, Any]:
        """Health check for monitoring"""
        return {
            "status": "healthy" if self.is_ready and self.is_running else "unhealthy",
            "driver_ready": self.driver is not None,
            "is_running": self.is_running,
            "active_sessions": len(self.user_sessions),
            "stats": self.stats.copy(),
            "uptime_seconds": (
                (datetime.utcnow() - self.stats["start_time"]).total_seconds()
                if self.stats["start_time"]
                else 0
            ),
        }

    async def stop(self) -> None:
        """Stop WhatsApp service gracefully"""
        logger.info("🛑 Stopping WhatsApp service")

        self.is_running = False
        self.is_ready = False

        # Save active sessions to database
        for session in self.user_sessions.values():
            try:
                await self.user_service.save_session(session)
            except Exception as e:
                logger.error("Error saving session", error=str(e))

        # Close WebDriver
        if self.driver:
            try:
                self.driver.quit()
            except Exception as e:
                logger.error("Error closing WebDriver", error=str(e))

        logger.info("✅ WhatsApp service stopped")
