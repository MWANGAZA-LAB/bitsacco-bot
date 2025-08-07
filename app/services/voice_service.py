"""
ElevenLabs Voice Service for Bitsacco WhatsApp Bot
Handles voice synthesis using ElevenLabs API
"""

import logging
from typing import Optional, Dict, Any
from pathlib import Path

try:
    from elevenlabs import generate, save, set_api_key, voices
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    logging.warning(
        "ElevenLabs package not available. Voice features will be disabled."
    )

from ..config import settings


class ElevenLabsVoiceService:
    """Voice synthesis service using ElevenLabs API"""

    def __init__(self):
        self.api_key: Optional[str] = settings.ELEVENLABS_API_KEY
        self.voice_id: str = settings.ELEVENLABS_VOICE_ID
        self.is_initialized: bool = False
        self.is_running: bool = False
        self.available_voices: Dict[str, Any] = {}
        self.logger = logging.getLogger(__name__)

    async def start(self) -> None:
        """Initialize the voice service"""
        if not ELEVENLABS_AVAILABLE:
            self.logger.warning("ElevenLabs not available - voice service disabled")
            return

        if not self.api_key:
            self.logger.warning(
                "No ElevenLabs API key configured - voice service disabled"
            )
            return

        try:
            # Set API key
            set_api_key(self.api_key)

            # Load available voices
            await self._load_voices()

            self.is_initialized = True
            self.is_running = True
            self.logger.info("ElevenLabs voice service started successfully")
            
        except Exception as e:
            self.logger.error(
                f"Failed to start ElevenLabs voice service: {e}"
            )
            self.is_initialized = False
            self.is_running = False

    async def stop(self) -> None:
        """Stop the voice service"""
        self.is_running = False
        self.logger.info("ElevenLabs voice service stopped")

    async def _load_voices(self) -> None:
        """Load available voices from ElevenLabs API"""
        try:
            voices_list = voices()
            self.available_voices = {
                voice.voice_id: {
                    "name": voice.name,
                    "description": voice.labels.get("description", ""),
                    "category": voice.labels.get("category", "general"),
                    "language": voice.labels.get("language", "en")
                }
                for voice in voices_list
            }
            self.logger.info(f"Loaded {len(self.available_voices)} voices from ElevenLabs")
        except Exception as e:
            self.logger.error(f"Failed to load voices: {e}")
            self.available_voices = {}

    async def synthesize_speech(self, text: str, voice_id: Optional[str] = None) -> Optional[bytes]:
        """
        Synthesize speech from text
        
        Args:
            text: Text to synthesize
            voice_id: Voice ID to use (defaults to configured voice)
            
        Returns:
            Audio data as bytes, or None if failed
        """
        if not self.is_running or not self.is_initialized:
            self.logger.warning("Voice service not running")
            return None

        if not text.strip():
            self.logger.warning("Empty text provided for synthesis")
            return None

        voice_to_use = voice_id or self.voice_id
        
        try:
            # Generate audio
            audio = generate(
                text=text,
                voice=voice_to_use,
                model="eleven_monolingual_v1"
            )
            
            self.logger.info(f"Successfully synthesized speech for text: {text[:50]}...")
            return audio
            
        except Exception as e:
            self.logger.error(f"Failed to synthesize speech: {e}")
            return None

    async def save_speech_to_file(self, text: str, file_path: str, voice_id: Optional[str] = None) -> bool:
        """
        Synthesize speech and save to file
        
        Args:
            text: Text to synthesize
            file_path: Path to save the audio file
            voice_id: Voice ID to use
            
        Returns:
            True if successful, False otherwise
        """
        audio_data = await self.synthesize_speech(text, voice_id)
        if not audio_data:
            return False

        try:
            # Ensure directory exists
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Save audio to file
            save(audio_data, file_path)
            self.logger.info(f"Speech saved to {file_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save speech to file: {e}")
            return False

    async def get_available_voices(self) -> Dict[str, Any]:
        """Get list of available voices"""
        if not self.is_initialized:
            await self._load_voices()
        return self.available_voices

    async def health_check(self) -> Dict[str, Any]:
        """Health check for the voice service"""
        return {
            "status": "healthy" if self.is_running else "unhealthy",
            "initialized": self.is_initialized,
            "api_key_configured": bool(self.api_key),
            "elevenlabs_available": ELEVENLABS_AVAILABLE,
            "available_voices_count": len(self.available_voices),
            "current_voice_id": self.voice_id
        }

    def get_voice_info(self, voice_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific voice"""
        return self.available_voices.get(voice_id)

    async def test_voice(self, text: str = "Hello! This is a test of the voice service.") -> Optional[bytes]:
        """Test the voice service with sample text"""
        return await self.synthesize_speech(text)
