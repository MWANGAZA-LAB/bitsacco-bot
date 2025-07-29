"""
Audio Service for text-to-speech and voice processing
"""
import asyncio
import aiohttp
import aiofiles
from typing import Dict, List, Any, Optional, BinaryIO
import structlog
from datetime import datetime
import json
import base64
import io
import tempfile
import os
from pathlib import Path
import hashlib

from ..config import settings

logger = structlog.get_logger()


class AudioService:
    """Audio processing service for TTS and voice features"""
    
    def __init__(self):
        self.elevenlabs_api_key = settings.elevenlabs_api_key
        self.elevenlabs_base_url = "https://api.elevenlabs.io/v1"
        self.audio_cache = {}
        self.cache_dir = Path("cache/audio")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Default voice settings
        self.default_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
        self.default_model_id = "eleven_multilingual_v2"
        
        # Supported languages for multilingual TTS
        self.supported_languages = {
            "en": "English",
            "sw": "Swahili", 
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "pt": "Portuguese",
            "hi": "Hindi",
            "ar": "Arabic",
            "zh": "Chinese",
            "ja": "Japanese",
            "ko": "Korean"
        }
        
        if not self.elevenlabs_api_key:
            logger.warning("ElevenLabs API key not configured, TTS features will be limited")
    
    async def text_to_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        language: str = "en",
        voice_settings: Optional[Dict] = None,
        optimize_streaming: bool = False
    ) -> Dict[str, Any]:
        """Convert text to speech using ElevenLabs API"""
        try:
            start_time = datetime.now()
            
            if not self.elevenlabs_api_key:
                return {
                    "status": "error",
                    "error": "ElevenLabs API key not configured"
                }
            
            # Use default voice if none specified
            voice_id = voice_id or self.default_voice_id
            
            # Check cache first
            cache_key = self._generate_cache_key(text, voice_id, language, voice_settings)
            cached_audio = await self._get_cached_audio(cache_key)
            
            if cached_audio:
                logger.info("Audio served from cache", cache_key=cache_key)
                return {
                    "status": "success",
                    "audio_data": cached_audio["audio_data"],
                    "content_type": cached_audio["content_type"],
                    "duration_ms": cached_audio.get("duration_ms"),
                    "source": "cache",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Prepare voice settings
            default_settings = {
                "stability": 0.75,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
            
            if voice_settings:
                default_settings.update(voice_settings)
            
            # Prepare request
            url = f"{self.elevenlabs_base_url}/text-to-speech/{voice_id}"
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
            
            payload = {
                "text": text,
                "model_id": self.default_model_id,
                "voice_settings": default_settings
            }
            
            # Add streaming optimization if requested
            if optimize_streaming:
                headers["Accept"] = "audio/mpeg"
                payload["optimize_streaming_latency"] = 1
            
            # Make API request
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        audio_content = await response.read()
                        content_type = response.headers.get("content-type", "audio/mpeg")
                        
                        # Calculate duration (approximate for MP3)
                        duration_ms = self._estimate_audio_duration(audio_content, text)
                        
                        # Cache the result
                        await self._cache_audio(cache_key, {
                            "audio_data": audio_content,
                            "content_type": content_type,
                            "duration_ms": duration_ms,
                            "created_at": datetime.now().isoformat()
                        })
                        
                        processing_time = (datetime.now() - start_time).total_seconds()
                        
                        logger.info("TTS generated successfully", 
                                   text_length=len(text),
                                   voice_id=voice_id,
                                   language=language,
                                   processing_time=processing_time)
                        
                        return {
                            "status": "success",
                            "audio_data": audio_content,
                            "content_type": content_type,
                            "duration_ms": duration_ms,
                            "processing_time_ms": int(processing_time * 1000),
                            "source": "elevenlabs",
                            "timestamp": datetime.now().isoformat()
                        }
                    
                    else:
                        error_text = await response.text()
                        logger.error("ElevenLabs API error", 
                                   status=response.status, 
                                   error=error_text)
                        
                        return {
                            "status": "error",
                            "error": f"ElevenLabs API error: {response.status}",
                            "details": error_text
                        }
        
        except Exception as e:
            logger.error("TTS generation failed", error=str(e))
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def generate_whatsapp_audio_message(
        self,
        text: str,
        voice_id: Optional[str] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Generate audio message optimized for WhatsApp"""
        try:
            # WhatsApp audio message optimization
            optimized_settings = {
                "stability": 0.8,  # Higher stability for clarity
                "similarity_boost": 0.7,
                "style": 0.1,  # Slightly more expressive
                "use_speaker_boost": True
            }
            
            # Limit text length for WhatsApp (approximate 30 seconds max)
            max_chars = 300
            if len(text) > max_chars:
                text = text[:max_chars].rsplit(' ', 1)[0] + "..."
                logger.warning("Text truncated for WhatsApp audio", original_length=len(text))
            
            # Generate TTS with WhatsApp optimization
            result = await self.text_to_speech(
                text=text,
                voice_id=voice_id,
                language=language,
                voice_settings=optimized_settings,
                optimize_streaming=True
            )
            
            if result["status"] == "success":
                # Convert to base64 for WhatsApp API
                audio_base64 = base64.b64encode(result["audio_data"]).decode('utf-8')
                
                result.update({
                    "audio_base64": audio_base64,
                    "whatsapp_optimized": True,
                    "text_length": len(text),
                    "estimated_duration_seconds": result.get("duration_ms", 0) / 1000
                })
            
            return result
            
        except Exception as e:
            logger.error("WhatsApp audio generation failed", error=str(e))
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def get_available_voices(self) -> Dict[str, Any]:
        """Get list of available voices from ElevenLabs"""
        try:
            if not self.elevenlabs_api_key:
                return {
                    "status": "error",
                    "error": "ElevenLabs API key not configured"
                }
            
            url = f"{self.elevenlabs_base_url}/voices"
            headers = {
                "Accept": "application/json",
                "xi-api-key": self.elevenlabs_api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        voices_data = await response.json()
                        
                        # Process and categorize voices
                        processed_voices = []
                        for voice in voices_data.get("voices", []):
                            processed_voices.append({
                                "voice_id": voice["voice_id"],
                                "name": voice["name"],
                                "description": voice.get("description", ""),
                                "category": voice.get("category", "generated"),
                                "labels": voice.get("labels", {}),
                                "preview_url": voice.get("preview_url"),
                                "available_for_tiers": voice.get("available_for_tiers", [])
                            })
                        
                        # Recommend voices for different use cases
                        recommendations = self._recommend_voices(processed_voices)
                        
                        return {
                            "status": "success",
                            "voices": processed_voices,
                            "total_voices": len(processed_voices),
                            "recommendations": recommendations,
                            "timestamp": datetime.now().isoformat()
                        }
                    
                    else:
                        error_text = await response.text()
                        logger.error("Failed to fetch voices", 
                                   status=response.status, 
                                   error=error_text)
                        
                        return {
                            "status": "error",
                            "error": f"API error: {response.status}",
                            "details": error_text
                        }
        
        except Exception as e:
            logger.error("Voice fetching failed", error=str(e))
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def analyze_audio_content(self, text: str) -> Dict[str, Any]:
        """Analyze text content to optimize audio generation"""
        try:
            analysis = {
                "character_count": len(text),
                "word_count": len(text.split()),
                "estimated_duration_seconds": self._estimate_speech_duration(text),
                "complexity_score": self._calculate_text_complexity(text),
                "language_detected": self._detect_language(text),
                "recommended_settings": {},
                "optimization_suggestions": []
            }
            
            # Generate recommendations based on analysis
            if analysis["character_count"] > 500:
                analysis["optimization_suggestions"].append(
                    "Consider splitting into multiple shorter audio messages"
                )
            
            if analysis["complexity_score"] > 0.7:
                analysis["recommended_settings"]["stability"] = 0.85
                analysis["optimization_suggestions"].append(
                    "High complexity text detected - using higher stability"
                )
            
            if analysis["estimated_duration_seconds"] > 60:
                analysis["optimization_suggestions"].append(
                    "Audio will be longer than 1 minute - consider summarizing"
                )
            
            # Recommend voice based on content
            content_type = self._classify_content_type(text)
            analysis["content_type"] = content_type
            analysis["recommended_voice"] = self._recommend_voice_for_content(content_type)
            
            return analysis
            
        except Exception as e:
            logger.error("Audio content analysis failed", error=str(e))
            return {
                "error": str(e),
                "character_count": len(text),
                "word_count": len(text.split())
            }
    
    async def create_personalized_voice_message(
        self,
        user_id: str,
        message_type: str,
        dynamic_content: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        """Create personalized voice message using templates"""
        try:
            # Get message template
            template = self._get_message_template(message_type, language)
            
            if not template:
                return {
                    "status": "error",
                    "error": f"Template not found for message type: {message_type}"
                }
            
            # Generate personalized text
            personalized_text = template.format(**dynamic_content)
            
            # Select appropriate voice based on message type
            voice_id = self._select_voice_for_message_type(message_type)
            
            # Generate audio
            result = await self.generate_whatsapp_audio_message(
                text=personalized_text,
                voice_id=voice_id,
                language=language
            )
            
            if result["status"] == "success":
                result.update({
                    "message_type": message_type,
                    "personalized_for": user_id,
                    "template_used": template,
                    "dynamic_content": dynamic_content
                })
            
            logger.info("Personalized voice message created", 
                       user_id=user_id,
                       message_type=message_type,
                       language=language)
            
            return result
            
        except Exception as e:
            logger.error("Personalized voice message creation failed", 
                        error=str(e), 
                        user_id=user_id)
            return {
                "status": "error",
                "error": str(e)
            }
    
    # Helper methods
    def _generate_cache_key(
        self, 
        text: str, 
        voice_id: str, 
        language: str, 
        voice_settings: Optional[Dict]
    ) -> str:
        """Generate cache key for audio content"""
        content = f"{text}_{voice_id}_{language}_{json.dumps(voice_settings or {}, sort_keys=True)}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def _get_cached_audio(self, cache_key: str) -> Optional[Dict]:
        """Retrieve audio from cache"""
        try:
            cache_file = self.cache_dir / f"{cache_key}.json"
            audio_file = self.cache_dir / f"{cache_key}.mp3"
            
            if cache_file.exists() and audio_file.exists():
                async with aiofiles.open(cache_file, 'r') as f:
                    metadata = json.loads(await f.read())
                
                async with aiofiles.open(audio_file, 'rb') as f:
                    audio_data = await f.read()
                
                metadata["audio_data"] = audio_data
                return metadata
            
            return None
            
        except Exception as e:
            logger.error("Cache retrieval failed", error=str(e), cache_key=cache_key)
            return None
    
    async def _cache_audio(self, cache_key: str, audio_data: Dict) -> None:
        """Cache audio content"""
        try:
            cache_file = self.cache_dir / f"{cache_key}.json"
            audio_file = self.cache_dir / f"{cache_key}.mp3"
            
            # Save metadata
            metadata = {k: v for k, v in audio_data.items() if k != "audio_data"}
            async with aiofiles.open(cache_file, 'w') as f:
                await f.write(json.dumps(metadata))
            
            # Save audio
            async with aiofiles.open(audio_file, 'wb') as f:
                await f.write(audio_data["audio_data"])
                
        except Exception as e:
            logger.error("Caching failed", error=str(e), cache_key=cache_key)
    
    def _estimate_audio_duration(self, audio_content: bytes, text: str) -> int:
        """Estimate audio duration in milliseconds"""
        # Rough estimation: average speech rate is ~150 words per minute
        word_count = len(text.split())
        estimated_seconds = (word_count / 150) * 60
        return int(estimated_seconds * 1000)
    
    def _estimate_speech_duration(self, text: str) -> float:
        """Estimate speech duration based on text"""
        # Average speaking rate: 150-160 words per minute
        word_count = len(text.split())
        return (word_count / 155) * 60  # in seconds
    
    def _calculate_text_complexity(self, text: str) -> float:
        """Calculate text complexity score (0-1)"""
        words = text.split()
        if not words:
            return 0
        
        # Simple complexity based on average word length and sentence structure
        avg_word_length = sum(len(word) for word in words) / len(words)
        sentence_count = text.count('.') + text.count('!') + text.count('?')
        avg_sentence_length = len(words) / max(sentence_count, 1)
        
        # Normalize to 0-1 scale
        complexity = min((avg_word_length / 10) + (avg_sentence_length / 20), 1.0)
        return complexity
    
    def _detect_language(self, text: str) -> str:
        """Simple language detection"""
        # Basic keyword-based detection for common Kenyan languages
        swahili_keywords = ["habari", "mambo", "asante", "karibu", "sawa", "nzuri"]
        
        if any(keyword in text.lower() for keyword in swahili_keywords):
            return "sw"
        
        return "en"  # Default to English
    
    def _classify_content_type(self, text: str) -> str:
        """Classify content type for voice optimization"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["save", "deposit", "bitcoin", "price", "invest"]):
            return "financial"
        elif any(word in text_lower for word in ["help", "how", "guide", "tutorial"]):
            return "educational"
        elif any(word in text_lower for word in ["welcome", "hello", "hi", "congratulations"]):
            return "greeting"
        elif any(word in text_lower for word in ["alert", "urgent", "important", "warning"]):
            return "alert"
        else:
            return "general"
    
    def _recommend_voice_for_content(self, content_type: str) -> str:
        """Recommend voice based on content type"""
        voice_recommendations = {
            "financial": "21m00Tcm4TlvDq8ikWAM",  # Professional, clear
            "educational": "AZnzlk1XvdvUeBnXmlld",  # Friendly, explanatory
            "greeting": "EXAVITQu4vr4xnSDxMaL",  # Warm, welcoming
            "alert": "21m00Tcm4TlvDq8ikWAM",  # Clear, attention-grabbing
            "general": "21m00Tcm4TlvDq8ikWAM"  # Default
        }
        
        return voice_recommendations.get(content_type, "21m00Tcm4TlvDq8ikWAM")
    
    def _recommend_voices(self, voices: List[Dict]) -> Dict[str, List[Dict]]:
        """Recommend voices for different use cases"""
        recommendations = {
            "customer_service": [],
            "education": [],
            "marketing": [],
            "notifications": []
        }
        
        for voice in voices:
            labels = voice.get("labels", {})
            
            # Simple categorization based on voice characteristics
            if "professional" in str(labels).lower():
                recommendations["customer_service"].append(voice)
            if "young" in str(labels).lower() or "friendly" in str(labels).lower():
                recommendations["education"].append(voice)
            if "confident" in str(labels).lower():
                recommendations["marketing"].append(voice)
            
            # Add to notifications if clear pronunciation
            recommendations["notifications"].append(voice)
        
        # Limit to top 3 recommendations per category
        for category in recommendations:
            recommendations[category] = recommendations[category][:3]
        
        return recommendations
    
    def _get_message_template(self, message_type: str, language: str) -> Optional[str]:
        """Get message template for personalization"""
        templates = {
            "en": {
                "welcome": "Hello {name}! Welcome to Bitsacco. I'm excited to help you start your Bitcoin savings journey.",
                "balance_update": "Hi {name}, your Bitcoin balance is now {balance} BTC, worth approximately {value_kes} KES.",
                "transaction_confirmation": "Your {transaction_type} of {amount} has been completed successfully. Transaction ID: {tx_id}",
                "goal_milestone": "Congratulations {name}! You've reached {percentage}% of your {goal_name} goal. Keep it up!",
                "price_alert": "Bitcoin price update: 1 BTC is now {price} KES. {trend_message}",
                "tip_of_day": "Here's today's Bitcoin tip: {tip_content}. Happy saving!"
            },
            "sw": {
                "welcome": "Hujambo {name}! Karibu Bitsacco. Nimefurahi kukusaidia kuanza safari yako ya akiba za Bitcoin.",
                "balance_update": "Hujambo {name}, akiba yako ya Bitcoin sasa ni {balance} BTC, inayolingana na {value_kes} KES.",
                "transaction_confirmation": "Muamala wako wa {transaction_type} wa {amount} umekamilika. Nambari ya muamala: {tx_id}",
                "goal_milestone": "Hongera {name}! Umefikia {percentage}% ya lengo lako la {goal_name}. Endelea hivyo!",
                "price_alert": "Bei ya Bitcoin: 1 BTC sasa ni {price} KES. {trend_message}",
                "tip_of_day": "Huu ni mshauri wa leo kuhusu Bitcoin: {tip_content}. Akiba njema!"
            }
        }
        
        return templates.get(language, {}).get(message_type)
    
    def _select_voice_for_message_type(self, message_type: str) -> str:
        """Select appropriate voice for message type"""
        voice_mapping = {
            "welcome": "EXAVITQu4vr4xnSDxMaL",  # Warm, welcoming
            "balance_update": "21m00Tcm4TlvDq8ikWAM",  # Professional
            "transaction_confirmation": "21m00Tcm4TlvDq8ikWAM",  # Clear, professional
            "goal_milestone": "EXAVITQu4vr4xnSDxMaL",  # Celebratory
            "price_alert": "21m00Tcm4TlvDq8ikWAM",  # Informative
            "tip_of_day": "AZnzlk1XvdvUeBnXmlld"  # Educational
        }
        
        return voice_mapping.get(message_type, "21m00Tcm4TlvDq8ikWAM")
    
    async def cleanup_cache(self, max_age_days: int = 7) -> Dict[str, Any]:
        """Clean up old cache files"""
        try:
            cutoff_time = datetime.now() - timedelta(days=max_age_days)
            removed_count = 0
            total_size_freed = 0
            
            for file_path in self.cache_dir.iterdir():
                if file_path.stat().st_mtime < cutoff_time.timestamp():
                    size = file_path.stat().st_size
                    file_path.unlink()
                    removed_count += 1
                    total_size_freed += size
            
            logger.info("Cache cleanup completed", 
                       removed_files=removed_count,
                       size_freed_mb=total_size_freed / (1024 * 1024))
            
            return {
                "status": "success",
                "removed_files": removed_count,
                "size_freed_bytes": total_size_freed,
                "size_freed_mb": round(total_size_freed / (1024 * 1024), 2)
            }
            
        except Exception as e:
            logger.error("Cache cleanup failed", error=str(e))
            return {
                "status": "error",
                "error": str(e)
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get audio service statistics"""
        cache_files = list(self.cache_dir.glob("*.mp3"))
        cache_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            "service": "Audio Service",
            "elevenlabs_enabled": bool(self.elevenlabs_api_key),
            "supported_languages": len(self.supported_languages),
            "cache_files": len(cache_files),
            "cache_size_mb": round(cache_size / (1024 * 1024), 2),
            "default_voice": self.default_voice_id,
            "features": [
                "text_to_speech",
                "whatsapp_optimization",
                "voice_personalization",
                "multilingual_support",
                "content_analysis"
            ],
            "timestamp": datetime.now().isoformat()
        }
