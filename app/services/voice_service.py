"""
Voice Service - ElevenLabs integration for voice commands and responses
Handles speech-to-text, text-to-speech, and voice message processing
"""

import asyncio
import io
import tempfile
import aiofiles
from typing import Optional, Dict, Any, List
from pathlib import Path
import httpx
import structlog
from pydub import AudioSegment
import speech_recognition as sr
from elevenlabs import VoiceSettings
from elevenlabs.client import ElevenLabs

from ..config import settings
from ..models.user import UserSession

logger = structlog.get_logger(__name__)


class VoiceService:
    """Production voice service with ElevenLabs integration"""

    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None
        self.elevenlabs_client: Optional[ElevenLabs] = None
        self.speech_recognizer: Optional[sr.Recognizer] = None
        self.is_running = False

        # Voice settings
        self.default_voice_id = settings.ELEVENLABS_VOICE_ID
        self.voice_stability = 0.5
        self.voice_clarity = 0.75
        self.voice_style = 0.0

        # Supported audio formats
        self.supported_formats = [".ogg", ".mp3", ".wav", ".m4a", ".aac"]

        # Language detection settings
        self.supported_languages = {
            "en": "english",
            "sw": "swahili",
            "auto": "auto-detect",
        }

    async def start(self) -> None:
        """Start the voice service"""
        try:
            # Initialize HTTP client
            self.client = httpx.AsyncClient(
                timeout=httpx.Timeout(60.0),  # Longer timeout for audio processing
                limits=httpx.Limits(max_keepalive_connections=5),
            )

            # Initialize ElevenLabs client
            if settings.ELEVENLABS_API_KEY:
                self.elevenlabs_client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
            else:
                logger.warning(
                    "ElevenLabs API key not provided - voice responses disabled"
                )

            # Initialize speech recognition
            self.speech_recognizer = sr.Recognizer()

            # Test services
            await self._test_services()

            self.is_running = True
            logger.info("✅ Voice service started")

        except Exception as e:
            logger.error("❌ Failed to start voice service", error=str(e))
            raise

    async def stop(self) -> None:
        """Stop the voice service"""
        self.is_running = False

        if self.client:
            await self.client.aclose()

        logger.info("🛑 Voice service stopped")

    async def process_voice_message(
        self, audio_data: bytes, audio_format: str = "ogg", language: str = "auto"
    ) -> Optional[str]:
        """Process voice message and convert to text"""
        try:
            # Convert audio to WAV format for speech recognition
            wav_data = await self._convert_to_wav(audio_data, audio_format)

            if not wav_data:
                logger.error("Failed to convert audio to WAV format")
                return None

            # Perform speech-to-text
            text = await self._speech_to_text(wav_data, language)

            if text:
                logger.debug(
                    "Voice message transcribed",
                    text_length=len(text),
                    language=language,
                )
                return text.strip()

            return None

        except Exception as e:
            logger.error("Error processing voice message", error=str(e))
            return None

    async def generate_voice_response(
        self,
        text: str,
        voice_id: Optional[str] = None,
        user_session: Optional[UserSession] = None,
    ) -> Optional[bytes]:
        """Generate voice response using ElevenLabs TTS"""
        try:
            if not self.elevenlabs_client:
                logger.warning("ElevenLabs client not available")
                return None

            # Use custom voice or default
            voice_id = voice_id or self.default_voice_id

            # Customize voice settings based on user preferences
            voice_settings = self._get_voice_settings(user_session)

            # Generate audio
            audio_generator = self.elevenlabs_client.generate(
                text=text,
                voice=voice_id,
                voice_settings=voice_settings,
                model="eleven_multilingual_v2",  # Supports multiple languages
            )

            # Convert generator to bytes
            audio_data = b"".join(audio_generator)

            logger.debug(
                "Voice response generated",
                text_length=len(text),
                audio_size=len(audio_data),
            )

            return audio_data

        except Exception as e:
            logger.error("Error generating voice response", error=str(e))
            return None

    async def detect_language(self, audio_data: bytes) -> str:
        """Detect language from audio data"""
        try:
            # Convert to WAV for processing
            wav_data = await self._convert_to_wav(audio_data, "ogg")

            if not wav_data:
                return "en"  # Default to English

            # Try to detect language using speech recognition
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(wav_data)
                temp_file.flush()

                with sr.AudioFile(temp_file.name) as source:
                    audio = self.speech_recognizer.record(source)

                # Try different languages
                for lang_code in ["en-US", "sw-KE"]:
                    try:
                        self.speech_recognizer.recognize_google(
                            audio, language=lang_code
                        )
                        return lang_code[:2]  # Return just the language part
                    except sr.UnknownValueError:
                        continue
                    except sr.RequestError:
                        break

                return "en"  # Default fallback

        except Exception as e:
            logger.debug("Language detection failed", error=str(e))
            return "en"

    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Get available voices from ElevenLabs"""
        try:
            if not self.elevenlabs_client:
                return []

            voices = self.elevenlabs_client.voices.get_all()

            voice_list = []
            for voice in voices.voices:
                voice_list.append(
                    {
                        "voice_id": voice.voice_id,
                        "name": voice.name,
                        "category": voice.category,
                        "labels": voice.labels,
                        "description": getattr(voice, "description", ""),
                    }
                )

            return voice_list

        except Exception as e:
            logger.error("Error fetching available voices", error=str(e))
            return []

    async def health_check(self) -> Dict[str, Any]:
        """Health check for monitoring"""
        status = "healthy"
        services = {}

        try:
            # Check ElevenLabs service
            if self.elevenlabs_client:
                try:
                    voices = await self.get_available_voices()
                    services["elevenlabs"] = {
                        "status": "healthy",
                        "available_voices": len(voices),
                    }
                except Exception:
                    services["elevenlabs"] = {"status": "degraded"}
                    status = "degraded"
            else:
                services["elevenlabs"] = {"status": "disabled"}

            # Check speech recognition
            if self.speech_recognizer:
                services["speech_recognition"] = {"status": "healthy"}
            else:
                services["speech_recognition"] = {"status": "unhealthy"}
                status = "degraded"

        except Exception as e:
            logger.error("Voice service health check failed", error=str(e))
            status = "unhealthy"

        return {
            "status": status,
            "is_running": self.is_running,
            "services": services,
            "supported_formats": self.supported_formats,
            "supported_languages": list(self.supported_languages.keys()),
        }

    async def _convert_to_wav(
        self, audio_data: bytes, input_format: str
    ) -> Optional[bytes]:
        """Convert audio data to WAV format"""
        try:
            # Create audio segment from input data
            if input_format.lower() in ["ogg", "oga"]:
                audio = AudioSegment.from_ogg(io.BytesIO(audio_data))
            elif input_format.lower() == "mp3":
                audio = AudioSegment.from_mp3(io.BytesIO(audio_data))
            elif input_format.lower() == "m4a":
                audio = AudioSegment.from_file(io.BytesIO(audio_data), format="m4a")
            elif input_format.lower() == "aac":
                audio = AudioSegment.from_file(io.BytesIO(audio_data), format="aac")
            else:
                audio = AudioSegment.from_wav(io.BytesIO(audio_data))

            # Convert to WAV with standard settings for speech recognition
            audio = audio.set_frame_rate(16000).set_channels(1)

            # Export to bytes
            wav_buffer = io.BytesIO()
            audio.export(wav_buffer, format="wav")
            wav_buffer.seek(0)

            return wav_buffer.read()

        except Exception as e:
            logger.error(
                "Audio conversion failed", input_format=input_format, error=str(e)
            )
            return None

    async def _speech_to_text(
        self, wav_data: bytes, language: str = "auto"
    ) -> Optional[str]:
        """Convert speech to text using Google Speech Recognition"""
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(wav_data)
                temp_file.flush()

                with sr.AudioFile(temp_file.name) as source:
                    # Adjust for ambient noise
                    self.speech_recognizer.adjust_for_ambient_noise(
                        source, duration=0.5
                    )
                    audio = self.speech_recognizer.record(source)

                # Language mapping
                if language == "auto":
                    # Try English first, then Swahili
                    for lang in ["en-US", "sw-KE"]:
                        try:
                            text = self.speech_recognizer.recognize_google(
                                audio, language=lang
                            )
                            return text
                        except sr.UnknownValueError:
                            continue
                else:
                    lang_code = "sw-KE" if language == "sw" else "en-US"
                    text = self.speech_recognizer.recognize_google(
                        audio, language=lang_code
                    )
                    return text

                return None

        except sr.UnknownValueError:
            logger.debug("Speech recognition could not understand audio")
            return None
        except sr.RequestError as e:
            logger.error("Speech recognition service error", error=str(e))
            return None
        except Exception as e:
            logger.error("Speech to text conversion failed", error=str(e))
            return None

    def _get_voice_settings(
        self, user_session: Optional[UserSession] = None
    ) -> VoiceSettings:
        """Get voice settings based on user preferences"""
        # Default settings
        stability = self.voice_stability
        clarity = self.voice_clarity
        style = self.voice_style

        # Customize based on user session if available
        if user_session and hasattr(user_session, "voice_preferences"):
            prefs = user_session.voice_preferences
            stability = prefs.get("stability", stability)
            clarity = prefs.get("clarity", clarity)
            style = prefs.get("style", style)

        return VoiceSettings(
            stability=stability,
            similarity_boost=clarity,
            style=style,
            use_speaker_boost=True,
        )

    async def _test_services(self) -> None:
        """Test voice services connectivity"""
        try:
            # Test ElevenLabs if available
            if self.elevenlabs_client:
                voices = await self.get_available_voices()
                if not voices:
                    logger.warning("No voices available from ElevenLabs")

            # Test speech recognition
            if not self.speech_recognizer:
                raise Exception("Speech recognizer not initialized")

            logger.debug("Voice services tested successfully")

        except Exception as e:
            logger.warning("Voice services test failed", error=str(e))
