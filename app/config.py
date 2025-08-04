"""
Simplified Configuration for Bitsacco WhatsApp Bot
Compatible with pydantic v2 and testing environment
"""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    APP_NAME: str = "Bitsacco WhatsApp Bot"
    VERSION: str = "3.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./bitsacco_bot.db"
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Bitsacco API
    BITSACCO_API_URL: str = "https://api.bitsacco.com"
    BITSACCO_API_KEY: str = "dev-api-key-change-in-production"
    BITSACCO_TIMEOUT: int = 30

    # WhatsApp
    WHATSAPP_SESSION_NAME: str = "bitsacco-session"
    WHATSAPP_HEADLESS: bool = True
    WHATSAPP_TIMEOUT: int = 60

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS: int = 1000
    OPENAI_TEMPERATURE: float = 0.7

    # Bitcoin Price API
    COINGECKO_API_KEY: Optional[str] = None
    BITCOIN_PRICE_UPDATE_INTERVAL: int = 60
    BITCOIN_PRICE_CACHE_TTL: int = 300

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # Directories
    DATA_DIR: str = "data"
    LOGS_DIR: str = "logs"
    TEMP_DIR: str = "temp"

    # ElevenLabs
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_VOICE_ID: str = "default"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # Ignore extra fields from .env
    )


# Global settings instance
settings = Settings()
