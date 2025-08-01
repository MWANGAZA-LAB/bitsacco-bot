"""
ElevenLabs Voice Service - Text-to-Speech integration
Handles voice synthesis for WhatsApp bot responses
"""

import aiohttp
import asyncio
from typing import Dict, Any, Optional, List
import structlog
from io import BytesIO

from ..config import settings

logger = structlog.get_logger(__name__)


class ElevenLabsVoiceService:
    """ElevenLabs voice synthesis service"""

    def __init__(self):
        self.api_key = "sk_8bf25f612eaefde40b8a5cdc3b4168be22187fcd4228a83a"
        self.base_url = "https://api.elevenlabs.io/v1"
        self.is_running = False
        self.available_voices = []
        
        # Default voice settings
        self.default_settings = {
            "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel voice
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }

    async def start(self) -> None:
        """Start the voice service"""
        try:
            if not self.api_key:
                logger.warning("⚠️ ElevenLabs API key not configured")
                return
                
            # Test connection and load voices
            await self._load_available_voices()
            self.is_running = True
            logger.info("✅ ElevenLabs voice service started")
            
        except Exception as e:
            logger.warning("⚠️ Voice service failed to start", error=str(e))
            self.is_running = False

    async def stop(self) -> None:
        """Stop the voice service"""
        self.is_running = False
        logger.info("🛑 ElevenLabs voice service stopped")

    async def _load_available_voices(self) -> None:
        """Load available voices from ElevenLabs API"""
        try:
            headers = {
                "Accept": "application/json",
                "xi-api-key": self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/voices", 
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self.available_voices = data.get("voices", [])
                        logger.info(f"Loaded {len(self.available_voices)} voices")
                    else:
                        logger.error(f"Failed to load voices: {response.status}")
                        
        except Exception as e:
            logger.error("Error loading voices", error=str(e))

    async def synthesize_speech(
        self, 
        text: str, 
        voice_id: Optional[str] = None,
        voice_settings: Optional[Dict[str, Any]] = None
    ) -> Optional[bytes]:
        """Synthesize speech from text"""
        try:
            if not self.is_running:
                logger.warning("Voice service not running")
                return None
                
            voice_id = voice_id or self.default_settings["voice_id"]
            settings_to_use = voice_settings or self.default_settings["voice_settings"]
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key
            }
            
            data = {
                "text": text,
                "model_id": self.default_settings["model_id"],
                "voice_settings": settings_to_use
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    json=data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        audio_data = await response.read()
                        logger.info(f"Generated audio for text: {text[:50]}...")
                        return audio_data
                    else:
                        error_text = await response.text()
                        logger.error(f"Voice synthesis failed: {response.status} - {error_text}")
                        return None
                        
        except Exception as e:
            logger.error("Error synthesizing speech", error=str(e))
            return None

    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Get list of available voices"""
        if not self.available_voices:
            await self._load_available_voices()
            
        return [
            {
                "id": voice.get("voice_id"),
                "name": voice.get("name"),
                "category": voice.get("category"),
                "description": voice.get("description", ""),
                "preview_url": voice.get("preview_url"),
                "labels": voice.get("labels", {})
            }
            for voice in self.available_voices
        ]

    async def test_voice(
        self, 
        text: str = "Hello, this is a test of the voice synthesis system.",
        voice_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Test voice synthesis"""
        try:
            audio_data = await self.synthesize_speech(text, voice_id)
            
            if audio_data:
                return {
                    "success": True,
                    "message": "Voice test successful",
                    "audio_size": len(audio_data),
                    "text": text
                }
            else:
                return {
                    "success": False,
                    "message": "Voice synthesis failed",
                    "text": text
                }
                
        except Exception as e:
            logger.error("Voice test failed", error=str(e))
            return {
                "success": False,
                "message": f"Voice test error: {str(e)}",
                "text": text
            }

    async def get_voice_settings(self) -> Dict[str, Any]:
        """Get current voice settings"""
        return {
            "enabled": self.is_running,
            "api_key_configured": bool(self.api_key),
            "default_voice_id": self.default_settings["voice_id"],
            "model_id": self.default_settings["model_id"],
            "voice_settings": self.default_settings["voice_settings"],
            "available_voices_count": len(self.available_voices)
        }

    async def update_voice_settings(self, new_settings: Dict[str, Any]) -> bool:
        """Update voice settings"""
        try:
            if "voice_id" in new_settings:
                self.default_settings["voice_id"] = new_settings["voice_id"]
                
            if "voice_settings" in new_settings:
                self.default_settings["voice_settings"].update(
                    new_settings["voice_settings"]
                )
                
            logger.info("Voice settings updated", settings=new_settings)
            return True
            
        except Exception as e:
            logger.error("Error updating voice settings", error=str(e))
            return False
