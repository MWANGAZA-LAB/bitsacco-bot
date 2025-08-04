"""
Test Configuration - pytest setup and fixtures
"""

import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient
from fastapi.testclient import TestClient

from tests.test_app_simple import create_test_app
from app.database.models import Base


# Test database URL (SQLite in memory)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest.fixture(scope="session")
async def test_session_maker(test_engine):
    """Create test session maker"""
    return async_sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False
    )


@pytest.fixture
async def test_db(test_session_maker) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async with test_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture
def test_client():
    """Create test client"""
    app = create_test_app()
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Create async test client"""
    app = create_test_app()
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_whatsapp_message():
    """Mock WhatsApp message data"""
    return {
        "entry": [
            {
                "changes": [
                    {
                        "field": "messages",
                        "value": {
                            "messages": [
                                {
                                    "from": "+254700000000",
                                    "text": {"body": "Hello"},
                                    "type": "text",
                                    "timestamp": "1640995200",
                                }
                            ]
                        },
                    }
                ]
            }
        ]
    }


@pytest.fixture
def mock_bitcoin_price():
    """Mock Bitcoin price data"""
    return {
        "price_usd": 45000.00,
        "price_kes": 6750000.00,
        "change_24h_usd": 2.5,
        "change_24h_kes": 2.5,
        "source": "test",
    }
