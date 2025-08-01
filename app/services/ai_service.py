"""
AI Conversation Service - OpenAI integration for WhatsApp bot
Handles intelligent conversation management and responses
"""

from typing import Dict, Any, Optional, List
from openai import AsyncOpenAI
import structlog

from ..config import settings
from ..models.user import MessageContext, UserSession

logger = structlog.get_logger(__name__)


class AIConversationService:
    """Production AI conversation service with context management"""

    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        self.is_running = False

        # Conversation settings
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE

        # Context management
        self.conversation_contexts: Dict[str, List[Dict[str, str]]] = {}
        self.max_context_length = 20  # Maximum messages to keep in context

    async def start(self) -> None:
        """Start the AI service"""
        try:
            # Check if OpenAI API key is available
            if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.startswith('sk-demo'):
                logger.warning("⚠️ OpenAI API key not configured - AI features will be limited")
                self.is_running = False
                return

            # Initialize OpenAI client
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, timeout=30.0)

            # Test the connection
            await self._test_connection()

            self.is_running = True
            logger.info("✅ AI conversation service started")

        except Exception as e:
            logger.warning("⚠️ AI service failed to start - continuing without AI features", error=str(e))
            self.is_running = False

    async def stop(self) -> None:
        """Stop the AI service"""
        self.is_running = False
        self.conversation_contexts.clear()

        if self.client:
            await self.client.close()

        logger.info("🛑 AI conversation service stopped")

    async def generate_response(
        self, user_session: UserSession, message_context: MessageContext
    ) -> str:
        """Generate AI response for user message"""
        try:
            if not self.client:
                return "🤖 AI service is not available at the moment."

            # Get conversation context
            context = self._get_conversation_context(user_session.phone_number or "")

            # Add current message to context (placeholder since original_message doesn't exist)
            context.append(
                {"role": "user", "content": "User message"}  # TODO: Pass actual message
            )

            # Generate system prompt based on user state
            system_prompt = self._get_system_prompt(user_session, message_context)

            # Prepare messages for OpenAI
            messages = [{"role": "system", "content": system_prompt}] + context

            # Generate response
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                timeout=30.0,
            )

            ai_response = (
                response.choices[0].message.content.strip()
                if response.choices[0].message.content
                else "I apologize, I couldn't generate a response."
            )

            # Add AI response to context
            context.append({"role": "assistant", "content": ai_response})

            # Update conversation context
            self._update_conversation_context(user_session.phone_number or "", context)

            logger.debug(
                "AI response generated",
                user=user_session.phone_number,
                response_length=len(ai_response),
            )

            return ai_response

        except Exception as e:
            logger.error(
                "Error generating AI response",
                user=user_session.phone_number,
                error=str(e),
            )
            return (
                "🤖 I'm having trouble processing your message right now. "
                "Please try again in a moment."
            )

    async def generate_welcome_message(self, user_session: UserSession) -> str:
        """Generate personalized welcome message"""
        try:
            if user_session.is_authenticated:
                return f"""
👋 Welcome back to Bitsacco, {user_session.first_name or 'friend'}!

I'm your Bitcoin savings assistant. Here's what I can help you with:

💰 *Check Bitcoin Prices*
📊 *View Your Savings Balance*
💸 *Start Bitcoin Savings*
📈 *Track Your Investments*
🔍 *Get Market Updates*

Just type your request or ask me anything about Bitcoin!

_Type 'help' for more options_
                """.strip()
            else:
                return """
🌟 *Welcome to Bitsacco!*

I'm your personal Bitcoin savings assistant. I'll help you:

🚀 Start saving in Bitcoin easily
📱 Track your investments
💡 Learn about Bitcoin
📊 Get real-time market updates

To get started, I'll need to verify your phone number.

_Reply with 'start' to begin your Bitcoin journey!_
                """.strip()

        except Exception as e:
            logger.error("Error generating welcome message", error=str(e))
            return "👋 Welcome to Bitsacco! How can I help you today?"

    async def generate_help_message(self, user_session: UserSession) -> str:
        """Generate contextual help message"""
        if user_session.is_authenticated:
            return """
🔥 *Bitsacco Commands*

💰 *Bitcoin & Savings*
• `price` - Current Bitcoin price
• `balance` - Your savings balance
• `save [amount]` - Start saving (e.g., save 1000)
• `history` - Transaction history

📊 *Market Info*
• `market` - Market summary
• `trends` - Price trends
• `news` - Bitcoin news

⚙️ *Account*
• `profile` - Your account info
• `help` - This help message
• `support` - Contact support

Just type any command or ask me naturally!
Example: "What's the Bitcoin price?" or "I want to save 5000 KES"
            """.strip()
        else:
            return """
🚀 *Getting Started with Bitsacco*

First, let's verify your phone number to access your account.

📱 *Available Commands*
• `start` - Begin verification
• `price` - Check Bitcoin price
• `help` - This help message
• `about` - Learn about Bitsacco

After verification, you'll have access to savings, balance checking, and more!

_Type 'start' to begin!_
            """.strip()

    async def health_check(self) -> Dict[str, Any]:
        """Health check for monitoring"""
        try:
            if self.client and self.is_running:
                # Quick API test
                await self._test_connection()
                status = "healthy"
            else:
                status = "unhealthy"
        except Exception:
            status = "degraded"

        return {
            "status": status,
            "is_running": self.is_running,
            "model": self.model,
            "active_conversations": len(self.conversation_contexts),
        }

    def clear_conversation_context(self, phone_number: str) -> None:
        """Clear conversation context for user"""
        if phone_number in self.conversation_contexts:
            del self.conversation_contexts[phone_number]
            logger.debug("Conversation context cleared", user=phone_number)

    def _get_conversation_context(self, phone_number: str) -> List[Dict[str, str]]:
        """Get conversation context for user"""
        return self.conversation_contexts.get(phone_number, [])

    def _update_conversation_context(
        self, phone_number: str, context: List[Dict[str, str]]
    ) -> None:
        """Update conversation context for user"""
        # Trim context if too long
        if len(context) > self.max_context_length:
            # Keep system message and recent messages
            context = context[-self.max_context_length :]

        self.conversation_contexts[phone_number] = context

    def _get_system_prompt(
        self, user_session: UserSession, message_context: MessageContext
    ) -> str:
        """Generate system prompt based on context"""
        base_prompt = """
You are a helpful Bitcoin savings assistant for Bitsacco,
a Bitcoin savings platform in Kenya.

PERSONALITY:
- Friendly, professional, and knowledgeable about Bitcoin
- Use emojis appropriately but don't overdo it
- Keep responses concise and actionable
- Be encouraging about Bitcoin savings

CAPABILITIES:
- Help users understand Bitcoin and its benefits
- Guide users through savings processes
- Provide market information and insights
- Answer questions about Bitsacco services

GUIDELINES:
- Always prioritize user security and education
- Explain Bitcoin concepts in simple terms
- Encourage long-term savings mindset
- Use Kenyan context (KES currency)
- If you don't know something, be honest and offer to help find information

TONE: Professional yet friendly, educational, encouraging
        """.strip()

        # Add user-specific context
        if user_session.is_authenticated:
            user_context = f"""
USER CONTEXT:
- Name: {user_session.first_name or 'User'}
- Phone: {user_session.phone_number}
- Authenticated: Yes
- Current State: {user_session.current_state}
            """
        else:
            user_context = """
USER CONTEXT:
- Not authenticated yet
- Guide them through verification process
            """

        return f"{base_prompt}\n\n{user_context}"

    async def _test_connection(self) -> None:
        """Test OpenAI API connection"""
        if not self.client:
            raise Exception("OpenAI client not initialized")

        # Simple test completion
        await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1,
            timeout=10.0,
        )
