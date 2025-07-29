"""
Service Tests - Test core business logic services
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

from app.services.user_service import UserService
from app.services.ai_service import AIConversationService
from app.services.bitcoin_service import BitcoinPriceService
from app.models.user import UserSession, UserState, MessageContext, BitcoinPrice


class TestUserService:
    """Test user service functionality"""

    @pytest.fixture
    def mock_bitsacco_api(self):
        """Mock Bitsacco API service"""
        mock = AsyncMock()
        mock.get_user_by_phone.return_value = {
            "first_name": "John",
            "last_name": "Doe",
            "created_at": "2024-01-01",
        }
        mock.send_otp.return_value = True
        mock.verify_otp.return_value = True
        return mock

    @pytest.fixture
    def user_service(self, mock_bitsacco_api):
        """User service instance"""
        return UserService(mock_bitsacco_api)

    @pytest.mark.asyncio
    async def test_create_session(self, user_service):
        """Test session creation"""
        session = await user_service.get_or_create_session("+254700000000")

        assert session.phone_number == "+254700000000"
        assert session.current_state == UserState.INITIAL
        assert not session.is_authenticated

    @pytest.mark.asyncio
    async def test_start_authentication_success(self, user_service):
        """Test successful authentication start"""
        success, message = await user_service.start_authentication("+254700000000")

        assert success is True
        assert "Verification Code Sent" in message

    @pytest.mark.asyncio
    async def test_verify_otp_success(self, user_service):
        """Test successful OTP verification"""
        # Start authentication first
        await user_service.start_authentication("+254700000000")

        # Verify OTP
        success, message = await user_service.verify_otp("+254700000000", "123456")

        assert success is True
        assert "Verification Successful" in message

    @pytest.mark.asyncio
    async def test_phone_number_cleaning(self, user_service):
        """Test phone number normalization"""
        test_numbers = [
            ("0700000000", "+254700000000"),
            ("254700000000", "+254700000000"),
            ("+254700000000", "+254700000000"),
            ("700000000", "+254700000000"),
        ]

        for input_num, expected in test_numbers:
            cleaned = user_service._clean_phone_number(input_num)
            assert cleaned == expected


class TestAIService:
    """Test AI conversation service"""

    @pytest.fixture
    def mock_openai_client(self):
        """Mock OpenAI client"""
        mock = AsyncMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Hello! How can I help you?"
        mock.chat.completions.create.return_value = mock_response
        return mock

    @pytest.fixture
    def ai_service(self, mock_openai_client):
        """AI service instance"""
        service = AIConversationService()
        service.client = mock_openai_client
        service.is_running = True
        return service

    @pytest.mark.asyncio
    async def test_generate_response(self, ai_service):
        """Test AI response generation"""
        user_session = UserSession(
            phone_number="+254700000000",
            current_state=UserState.AUTHENTICATED,
            is_authenticated=True,
        )

        message_context = MessageContext(
            original_message="Hello", message_type="text", timestamp=datetime.utcnow()
        )

        response = await ai_service.generate_response(user_session, message_context)

        assert response == "Hello! How can I help you?"

    @pytest.mark.asyncio
    async def test_welcome_message_authenticated(self, ai_service):
        """Test welcome message for authenticated user"""
        user_session = UserSession(
            phone_number="+254700000000", first_name="John", is_authenticated=True
        )

        message = await ai_service.generate_welcome_message(user_session)

        assert "Welcome back to Bitsacco" in message
        assert "John" in message

    @pytest.mark.asyncio
    async def test_welcome_message_unauthenticated(self, ai_service):
        """Test welcome message for unauthenticated user"""
        user_session = UserSession(phone_number="+254700000000", is_authenticated=False)

        message = await ai_service.generate_welcome_message(user_session)

        assert "Welcome to Bitsacco" in message
        assert "Reply with 'start'" in message


class TestBitcoinService:
    """Test Bitcoin price service"""

    @pytest.fixture
    def mock_http_client(self):
        """Mock HTTP client"""
        mock = AsyncMock()
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "bitcoin": {
                "usd": 45000.0,
                "kes": 6750000.0,
                "usd_24h_change": 2.5,
                "kes_24h_change": 2.5,
            }
        }
        mock_response.raise_for_status.return_value = None
        mock.get.return_value = mock_response
        return mock

    @pytest.fixture
    def bitcoin_service(self, mock_http_client):
        """Bitcoin service instance"""
        service = BitcoinPriceService()
        service.client = mock_http_client
        service.is_running = True
        return service

    @pytest.mark.asyncio
    async def test_fetch_price(self, bitcoin_service):
        """Test price fetching"""
        await bitcoin_service._update_prices()

        price = await bitcoin_service.get_price("USD")
        assert price == 45000.0

        price_kes = await bitcoin_service.get_price("KES")
        assert price_kes == 6750000.0

    @pytest.mark.asyncio
    async def test_price_summary(self, bitcoin_service):
        """Test price summary generation"""
        # Set up cache with test data
        bitcoin_service.price_cache["btc"] = BitcoinPrice(
            price_usd=45000.0,
            price_kes=6750000.0,
            change_24h_usd=2.5,
            change_24h_kes=2.5,
            last_updated=datetime.utcnow(),
            source="test",
        )

        summary = await bitcoin_service.get_price_summary()

        assert "Bitcoin Price Update" in summary
        assert "$45,000.00" in summary
        assert "KES 6,750,000.00" in summary
