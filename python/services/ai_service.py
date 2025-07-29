"""
AI Service module for advanced natural language processing
"""
import asyncio
from typing import Dict, List, Any, Optional
import openai
import structlog
from datetime import datetime
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..config import settings


logger = structlog.get_logger()


class AIService:
    """Advanced AI service for natural language processing and conversation"""
    
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.conversation_contexts = {}
        self.intent_patterns = self._initialize_intent_patterns()
        
        if not self.client:
            logger.warning("OpenAI API key not configured, AI features will be limited")
    
    def _initialize_intent_patterns(self) -> Dict[str, List[str]]:
        """Initialize intent recognition patterns"""
        return {
            "greeting": [
                "hello", "hi", "hey", "good morning", "good evening", 
                "mambo", "habari", "salaam", "hujambo"
            ],
            "balance_inquiry": [
                "balance", "how much", "my bitcoin", "wallet", "savings",
                "money", "account", "total", "worth"
            ],
            "save_bitcoin": [
                "save", "deposit", "invest", "add money", "contribute",
                "get bitcoin", "accumulate", "invest in"
            ],
            "withdraw_bitcoin": [
                "withdraw", "cash out", "redeem", "liquidate",
                "get money back", "convert to cash"
            ],
            "price_inquiry": [
                "price", "rate", "cost", "value", "bitcoin price", "current price",
                "current rate", "price", "cost", "value", "today",
                "rate", "worth", "current value"
            ],
            "goal_management": [
                "goal", "target", "save for", "saving plan", "objective",
                "aim", "plan", "milestone"
            ],
            "chama_management": [
                "chama", "group", "friends", "together", "collective",
                "community", "team", "joint"
            ],
            "help_request": [
                "help", "how", "what", "explain", "guide", "instructions",
                "assistance", "support", "tutorial"
            ],
            "tips_education": [
                "tip", "advice", "learn", "education", "knowledge",
                "information", "teach", "explain"
            ],
            "complaint": [
                "problem", "issue", "error", "not working", "failed",
                "bug", "wrong", "mistake"
            ],
            "gratitude": [
                "thank", "thanks", "grateful", "appreciate", "asante"
            ]
        }
    
    async def analyze_message(self, text: str, user_id: Optional[str] = None, context: Dict = None) -> Dict[str, Any]:
        """Analyze message for intent, sentiment, and entities"""
        try:
            start_time = datetime.now()
            
            # Basic preprocessing
            text_lower = text.lower().strip()
            
            # Intent recognition
            intent = self._recognize_intent(text_lower)
            
            # Sentiment analysis (simple rule-based for now)
            sentiment = self._analyze_sentiment(text_lower)
            
            # Entity extraction
            entities = self._extract_entities(text)
            
            # Confidence scoring
            confidence = self._calculate_confidence(text_lower, intent)
            
            # Advanced AI analysis if API key available
            ai_analysis = {}
            if self.client:
                ai_analysis = await self._openai_analysis(text, context or {})
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                "intent": intent,
                "sentiment": sentiment,
                "entities": entities,
                "confidence": confidence,
                "ai_analysis": ai_analysis,
                "processing_time_ms": int(processing_time * 1000),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info("Message analyzed", 
                       user_id=user_id, 
                       intent=intent, 
                       sentiment=sentiment,
                       processing_time=processing_time)
            
            return result
            
        except Exception as e:
            logger.error("Message analysis failed", error=str(e), user_id=user_id)
            return {
                "intent": "unknown",
                "sentiment": "neutral",
                "entities": {},
                "confidence": 0.0,
                "error": str(e)
            }
    
    def _recognize_intent(self, text: str) -> str:
        """Recognize intent using pattern matching"""
        best_intent = "general"
        max_score = 0
        
        for intent, patterns in self.intent_patterns.items():
            score = sum(1 for pattern in patterns if pattern in text)
            if score > max_score:
                max_score = score
                best_intent = intent
        
        # Special cases
        if any(word in text for word in ["otp", "code", "verification"]):
            return "auth_verification"
        elif text.isdigit() and len(text) >= 4:
            return "auth_otp_input"
        elif any(word in text for word in ["register", "sign up", "create account"]):
            return "auth_registration"
        
        return best_intent
    
    def _analyze_sentiment(self, text: str) -> str:
        """Simple rule-based sentiment analysis"""
        positive_words = [
            "good", "great", "excellent", "amazing", "wonderful", "fantastic",
            "happy", "pleased", "satisfied", "love", "like", "awesome",
            "thank", "thanks", "grateful", "appreciate"
        ]
        
        negative_words = [
            "bad", "terrible", "awful", "horrible", "hate", "dislike",
            "angry", "frustrated", "disappointed", "problem", "issue",
            "error", "failed", "wrong", "not working"
        ]
        
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract entities like amounts, currencies, dates"""
        entities = {}
        
        # Extract amounts (KES, USD, BTC)
        import re
        
        # KES amounts
        kes_pattern = r'(?:kes|ksh|sh)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:kes|ksh|sh)'
        kes_matches = re.findall(kes_pattern, text.lower())
        if kes_matches:
            entities["kes_amounts"] = [match[0] or match[1] for match in kes_matches]
        
        # USD amounts
        usd_pattern = r'(?:usd|\$)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:usd|\$)'
        usd_matches = re.findall(usd_pattern, text.lower())
        if usd_matches:
            entities["usd_amounts"] = [match[0] or match[1] for match in usd_matches]
        
        # BTC amounts
        btc_pattern = r'(?:btc|bitcoin)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:btc|bitcoin)'
        btc_matches = re.findall(btc_pattern, text.lower())
        if btc_matches:
            entities["btc_amounts"] = [match[0] or match[1] for match in btc_matches]
        
        # Phone numbers
        phone_pattern = r'(?:\+254|254|0)([17]\d{8})'
        phone_matches = re.findall(phone_pattern, text)
        if phone_matches:
            entities["phone_numbers"] = [f"+254{match}" for match in phone_matches]
        
        # Simple number extraction
        number_pattern = r'\b(\d+(?:,\d{3})*(?:\.\d+)?)\b'
        number_matches = re.findall(number_pattern, text)
        if number_matches:
            entities["numbers"] = number_matches
        
        return entities
    
    def _calculate_confidence(self, text: str, intent: str) -> float:
        """Calculate confidence score for intent recognition"""
        if intent == "general":
            return 0.3
        
        patterns = self.intent_patterns.get(intent, [])
        matches = sum(1 for pattern in patterns if pattern in text)
        
        if matches == 0:
            return 0.1
        elif matches == 1:
            return 0.6
        elif matches == 2:
            return 0.8
        else:
            return 0.95
    
    async def _openai_analysis(self, text: str, context: Dict) -> Dict[str, Any]:
        """Advanced analysis using OpenAI"""
        try:
            prompt = f"""
            Analyze the following user message for a financial WhatsApp assistant:
            
            Message: "{text}"
            Context: {json.dumps(context)}
            
            Provide analysis in JSON format with:
            1. intent_category (primary intent)
            2. sentiment_score (-1 to 1)
            3. urgency_level (low/medium/high)
            4. required_actions (list of actions needed)
            5. suggested_response_tone (formal/casual/empathetic)
            6. financial_entities (extracted financial information)
            """
            
            response = await self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You are an expert AI analyst for financial services."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.1
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            logger.error("OpenAI analysis failed", error=str(e))
            return {}
    
    async def generate_response(
        self, 
        message: str, 
        user_context: Dict = None,
        conversation_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """Generate intelligent response to user message"""
        try:
            start_time = datetime.now()
            
            # Analyze the incoming message
            analysis = await self.analyze_message(message, context=user_context)
            
            # Generate response based on intent
            response_text = await self._generate_contextual_response(
                message, analysis, user_context or {}, conversation_history or []
            )
            
            # Add suggested actions
            suggested_actions = self._get_suggested_actions(analysis["intent"])
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "response_text": response_text,
                "intent": analysis["intent"],
                "sentiment": analysis["sentiment"],
                "suggested_actions": suggested_actions,
                "confidence": analysis["confidence"],
                "processing_time_ms": int(processing_time * 1000),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error("Response generation failed", error=str(e))
            return {
                "response_text": "I'm having trouble understanding your message. Please try again or type 'help' for assistance.",
                "intent": "error",
                "suggested_actions": ["help", "try_again"]
            }
    
    async def _generate_contextual_response(
        self,
        message: str,
        analysis: Dict,
        user_context: Dict,
        conversation_history: List[Dict]
    ) -> str:
        """Generate contextual response based on analysis"""
        intent = analysis["intent"]
        sentiment = analysis["sentiment"]
        
        # Use OpenAI if available
        if self.client:
            return await self._openai_response_generation(
                message, analysis, user_context, conversation_history
            )
        
        # Fallback to template-based responses
        return self._template_based_response(intent, sentiment, analysis.get("entities", {}))
    
    async def _openai_response_generation(
        self,
        message: str,
        analysis: Dict,
        user_context: Dict,
        conversation_history: List[Dict]
    ) -> str:
        """Generate response using OpenAI"""
        try:
            context_str = json.dumps({
                "user_context": user_context,
                "analysis": analysis,
                "conversation_history": conversation_history[-5:]  # Last 5 messages
            })
            
            prompt = f"""
            You are Bitsacco, a friendly WhatsApp assistant helping Kenyan users save money with Bitcoin.
            
            User message: "{message}"
            Analysis: {context_str}
            
            Generate a helpful, conversational response that:
            1. Addresses the user's intent directly
            2. Uses appropriate Kenyan context
            3. Encourages Bitcoin savings
            4. Keeps response under 160 characters for WhatsApp
            5. Uses relevant emojis sparingly
            
            Respond naturally and helpfully.
            """
            
            response = await self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You are Bitsacco, a helpful financial assistant for Kenyan Bitcoin savers."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error("OpenAI response generation failed", error=str(e))
            return self._template_based_response(
                analysis["intent"], 
                analysis["sentiment"], 
                analysis.get("entities", {})
            )
    
    def _template_based_response(self, intent: str, sentiment: str, entities: Dict) -> str:
        """Generate template-based responses as fallback"""
        templates = {
            "greeting": [
                "Hello! Welcome to Bitsacco 🚀 Your Bitcoin savings assistant. How can I help you today?",
                "Hi there! Ready to save some Bitcoin? What would you like to do?",
                "Mambo! I'm here to help you grow your Bitcoin savings. What's on your mind?"
            ],
            "balance_inquiry": [
                "Let me check your Bitcoin balance for you! 💰",
                "I'll get your current savings information right away.",
                "Checking your Bitcoin wallet balance..."
            ],
            "save_bitcoin": [
                "Great choice! Let's add to your Bitcoin savings. How much would you like to invest?",
                "Smart move! 📈 How much KES would you like to convert to Bitcoin?",
                "Ready to build your Bitcoin savings? What amount are you thinking?"
            ],
            "price_inquiry": [
                "Bitcoin is looking strong today! 📊 Let me get you the current rates.",
                "Checking the latest Bitcoin prices in KES for you...",
                "Here are today's Bitcoin rates..."
            ],
            "help_request": [
                "I'm here to help! I can assist with saving Bitcoin, checking balances, setting goals, and joining Chamas. What interests you?",
                "No problem! I can help you save Bitcoin, track goals, or manage group savings. Where shall we start?",
                "Happy to help! 😊 I can guide you through Bitcoin purchases, savings goals, or Chama management."
            ]
        }
        
        response_list = templates.get(intent, [
            "I understand you're interested in Bitcoin savings. How can I assist you today?",
            "Thanks for reaching out! I'm here to help with your Bitcoin journey.",
            "Let me help you with that. What would you like to know about Bitcoin savings?"
        ])
        
        import random
        return random.choice(response_list)
    
    def _get_suggested_actions(self, intent: str) -> List[str]:
        """Get suggested actions based on intent"""
        action_map = {
            "greeting": ["check_balance", "save_bitcoin", "set_goal", "get_help"],
            "balance_inquiry": ["save_bitcoin", "set_goal", "transfer"],
            "save_bitcoin": ["specify_amount", "payment_method", "confirm_savings"],
            "price_inquiry": ["save_bitcoin", "price_alerts", "savings_info"],
            "goal_management": ["create_goal", "view_goals", "contribute_goal"],
            "chama_management": ["create_chama", "join_chama", "view_chamas"],
            "help_request": ["user_guide", "feature_tour", "contact_support"]
        }
        
        return action_map.get(intent, ["get_help", "try_again"])
    
    def get_stats(self) -> Dict[str, Any]:
        """Get AI service statistics"""
        return {
            "service": "AI Service",
            "openai_enabled": bool(self.client),
            "intent_patterns": len(self.intent_patterns),
            "active_contexts": len(self.conversation_contexts),
            "model": settings.openai_model,
            "timestamp": datetime.now().isoformat()
        }
