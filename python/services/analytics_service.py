"""
Analytics Service for user behavior analysis and insights
"""
import asyncio
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import structlog
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from scipy import stats
import sqlite3
import aiosqlite

from ..config import settings

logger = structlog.get_logger()


class AnalyticsService:
    """Advanced analytics for user behavior and business insights"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.churn_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.user_segmentation_model = KMeans(n_clusters=5, random_state=42)
        self.models_trained = False
        
        # In-memory cache for quick analytics
        self.analytics_cache = {}
        self.cache_expiry = timedelta(hours=1)
        
    async def analyze_user_behavior(
        self, 
        user_id: str, 
        time_window: int = 30,
        include_predictions: bool = True
    ) -> Dict[str, Any]:
        """Comprehensive user behavior analysis"""
        try:
            start_time = datetime.now()
            
            # Get user activity data
            user_data = await self._get_user_activity_data(user_id, time_window)
            
            if not user_data:
                return {
                    "user_id": user_id,
                    "status": "insufficient_data",
                    "message": "Not enough data for analysis"
                }
            
            # Basic statistics
            basic_stats = self._calculate_basic_stats(user_data)
            
            # Behavioral patterns
            patterns = self._analyze_behavioral_patterns(user_data)
            
            # Transaction analysis
            transaction_insights = self._analyze_transactions(user_data)
            
            # Engagement metrics
            engagement = self._calculate_engagement_metrics(user_data)
            
            # Predictions (if models are trained)
            predictions = {}
            if include_predictions and self.models_trained:
                predictions = await self._generate_user_predictions(user_id, user_data)
            
            # Risk assessment
            risk_assessment = self._assess_user_risk(user_data)
            
            # Personalized insights
            insights = self._generate_personalized_insights(
                basic_stats, patterns, transaction_insights, engagement
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                "user_id": user_id,
                "analysis_period_days": time_window,
                "basic_stats": basic_stats,
                "behavioral_patterns": patterns,
                "transaction_insights": transaction_insights,
                "engagement_metrics": engagement,
                "predictions": predictions,
                "risk_assessment": risk_assessment,
                "personalized_insights": insights,
                "processing_time_ms": int(processing_time * 1000),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info("User behavior analyzed", 
                       user_id=user_id, 
                       time_window=time_window,
                       processing_time=processing_time)
            
            return result
            
        except Exception as e:
            logger.error("User behavior analysis failed", error=str(e), user_id=user_id)
            return {
                "user_id": user_id,
                "status": "error",
                "error": str(e)
            }
    
    async def _get_user_activity_data(self, user_id: str, days: int) -> List[Dict]:
        """Fetch user activity data from database"""
        # In production, this would connect to actual database
        # For now, we'll simulate data structure
        
        # Simulated user activity data structure
        sample_data = [
            {
                "timestamp": datetime.now() - timedelta(days=i),
                "activity_type": "message",
                "message_count": np.random.randint(1, 10),
                "session_duration": np.random.randint(30, 300),
                "transaction_amount": np.random.uniform(0, 5000) if np.random.random() > 0.7 else 0,
                "transaction_type": np.random.choice(["deposit", "withdrawal", "transfer", None]),
                "features_used": np.random.choice([
                    ["balance"], ["save"], ["withdraw"], ["goal"], ["chama"], 
                    ["balance", "save"], ["goal", "chama"]
                ])
            }
            for i in range(days)
        ]
        
        return sample_data
    
    def _calculate_basic_stats(self, user_data: List[Dict]) -> Dict[str, Any]:
        """Calculate basic user statistics"""
        if not user_data:
            return {}
        
        df = pd.DataFrame(user_data)
        
        return {
            "total_sessions": len(user_data),
            "total_messages": df["message_count"].sum(),
            "avg_messages_per_session": df["message_count"].mean(),
            "total_session_time": df["session_duration"].sum(),
            "avg_session_duration": df["session_duration"].mean(),
            "total_transaction_volume": df["transaction_amount"].sum(),
            "transaction_count": len(df[df["transaction_amount"] > 0]),
            "avg_transaction_amount": df[df["transaction_amount"] > 0]["transaction_amount"].mean(),
            "most_active_day": df.groupby(df["timestamp"].dt.day_name())["message_count"].sum().idxmax(),
            "activity_trend": self._calculate_trend(df["message_count"].tolist())
        }
    
    def _analyze_behavioral_patterns(self, user_data: List[Dict]) -> Dict[str, Any]:
        """Analyze behavioral patterns"""
        df = pd.DataFrame(user_data)
        
        # Time-based patterns
        df["hour"] = pd.to_datetime(df["timestamp"]).dt.hour
        df["day_of_week"] = pd.to_datetime(df["timestamp"]).dt.dayofweek
        
        # Usage patterns
        peak_hours = df.groupby("hour")["message_count"].sum().nlargest(3).index.tolist()
        peak_days = df.groupby("day_of_week")["message_count"].sum().nlargest(2).index.tolist()
        
        # Feature usage patterns
        all_features = []
        for features in df["features_used"]:
            if features:
                all_features.extend(features)
        
        feature_usage = pd.Series(all_features).value_counts().to_dict()
        
        # Session patterns
        session_patterns = {
            "short_sessions": len(df[df["session_duration"] < 60]),
            "medium_sessions": len(df[(df["session_duration"] >= 60) & (df["session_duration"] < 180)]),
            "long_sessions": len(df[df["session_duration"] >= 180])
        }
        
        return {
            "peak_hours": peak_hours,
            "peak_days": peak_days,
            "feature_usage": feature_usage,
            "session_patterns": session_patterns,
            "consistency_score": self._calculate_consistency_score(df),
            "engagement_pattern": self._classify_engagement_pattern(df)
        }
    
    def _analyze_transactions(self, user_data: List[Dict]) -> Dict[str, Any]:
        """Analyze transaction patterns"""
        df = pd.DataFrame(user_data)
        transactions = df[df["transaction_amount"] > 0]
        
        if transactions.empty:
            return {
                "has_transactions": False,
                "message": "No transactions found"
            }
        
        # Transaction patterns
        transaction_types = transactions["transaction_type"].value_counts().to_dict()
        
        # Amount analysis
        amount_stats = {
            "mean": transactions["transaction_amount"].mean(),
            "median": transactions["transaction_amount"].median(),
            "std": transactions["transaction_amount"].std(),
            "min": transactions["transaction_amount"].min(),
            "max": transactions["transaction_amount"].max()
        }
        
        # Frequency analysis
        frequency_analysis = {
            "transactions_per_week": len(transactions) / (len(user_data) / 7),
            "avg_days_between_transactions": self._calculate_avg_days_between_transactions(transactions),
            "transaction_velocity": self._calculate_transaction_velocity(transactions)
        }
        
        return {
            "has_transactions": True,
            "transaction_count": len(transactions),
            "transaction_types": transaction_types,
            "amount_statistics": amount_stats,
            "frequency_analysis": frequency_analysis,
            "spending_pattern": self._classify_spending_pattern(transactions),
            "transaction_trend": self._calculate_trend(transactions["transaction_amount"].tolist())
        }
    
    def _calculate_engagement_metrics(self, user_data: List[Dict]) -> Dict[str, Any]:
        """Calculate user engagement metrics"""
        df = pd.DataFrame(user_data)
        
        # Basic engagement
        total_days = len(user_data)
        active_days = len(df[df["message_count"] > 0])
        
        # Engagement intensity
        high_engagement_days = len(df[df["message_count"] >= 5])
        medium_engagement_days = len(df[(df["message_count"] >= 2) & (df["message_count"] < 5)])
        low_engagement_days = len(df[(df["message_count"] == 1)])
        
        # Recency metrics
        last_activity = df["timestamp"].max()
        days_since_last_activity = (datetime.now() - last_activity).days
        
        # Stickiness (DAU/MAU approximation)
        recent_7_days = df[df["timestamp"] >= datetime.now() - timedelta(days=7)]
        recent_30_days = df[df["timestamp"] >= datetime.now() - timedelta(days=30)]
        
        stickiness = len(recent_7_days) / max(len(recent_30_days), 1) if len(recent_30_days) > 0 else 0
        
        return {
            "engagement_rate": active_days / total_days,
            "high_engagement_rate": high_engagement_days / total_days,
            "medium_engagement_rate": medium_engagement_days / total_days,
            "low_engagement_rate": low_engagement_days / total_days,
            "days_since_last_activity": days_since_last_activity,
            "stickiness_score": stickiness,
            "engagement_trend": self._calculate_trend(df["message_count"].tolist()),
            "engagement_category": self._categorize_engagement(active_days / total_days)
        }
    
    async def _generate_user_predictions(self, user_id: str, user_data: List[Dict]) -> Dict[str, Any]:
        """Generate ML-based predictions for user"""
        try:
            # Feature engineering for predictions
            features = self._engineer_features_for_prediction(user_data)
            
            predictions = {}
            
            # Churn prediction
            if self.models_trained:
                churn_prob = self.churn_model.predict_proba([features])[0][1]
                predictions["churn_probability"] = float(churn_prob)
                predictions["churn_risk"] = "high" if churn_prob > 0.7 else "medium" if churn_prob > 0.4 else "low"
            
            # Next transaction prediction
            predictions["next_transaction_probability"] = self._predict_next_transaction(user_data)
            
            # Lifetime value prediction
            predictions["predicted_ltv"] = self._predict_lifetime_value(user_data)
            
            # Engagement prediction
            predictions["next_week_engagement"] = self._predict_engagement(user_data)
            
            return predictions
            
        except Exception as e:
            logger.error("Prediction generation failed", error=str(e))
            return {}
    
    def _assess_user_risk(self, user_data: List[Dict]) -> Dict[str, Any]:
        """Assess various user risks"""
        df = pd.DataFrame(user_data)
        
        # Churn risk indicators
        days_since_last = (datetime.now() - df["timestamp"].max()).days
        engagement_decline = self._calculate_engagement_decline(df)
        transaction_decline = self._calculate_transaction_decline(df)
        
        churn_risk_score = (
            min(days_since_last / 30, 1.0) * 0.4 +
            engagement_decline * 0.3 +
            transaction_decline * 0.3
        )
        
        # Fraud risk (simplified)
        transaction_anomalies = self._detect_transaction_anomalies(df)
        fraud_risk_score = min(transaction_anomalies / 10, 1.0)
        
        # Value risk (likelihood of high-value user becoming inactive)
        avg_transaction = df[df["transaction_amount"] > 0]["transaction_amount"].mean()
        value_risk_score = churn_risk_score * (1 + min(avg_transaction / 10000, 1.0))
        
        return {
            "churn_risk_score": churn_risk_score,
            "churn_risk_level": "high" if churn_risk_score > 0.7 else "medium" if churn_risk_score > 0.4 else "low",
            "fraud_risk_score": fraud_risk_score,
            "fraud_risk_level": "high" if fraud_risk_score > 0.7 else "medium" if fraud_risk_score > 0.4 else "low",
            "value_risk_score": value_risk_score,
            "days_since_last_activity": days_since_last,
            "risk_factors": self._identify_risk_factors(df, churn_risk_score, fraud_risk_score)
        }
    
    def _generate_personalized_insights(
        self, 
        basic_stats: Dict, 
        patterns: Dict, 
        transactions: Dict, 
        engagement: Dict
    ) -> List[Dict[str, Any]]:
        """Generate personalized insights and recommendations"""
        insights = []
        
        # Engagement insights
        if engagement.get("engagement_rate", 0) < 0.3:
            insights.append({
                "type": "engagement",
                "priority": "high",
                "title": "Low Engagement Detected",
                "message": "User shows low engagement. Consider re-engagement campaign.",
                "recommendation": "Send personalized tips or special offers",
                "action": "engagement_campaign"
            })
        
        # Transaction insights
        if transactions.get("has_transactions") and transactions.get("transaction_count", 0) > 0:
            avg_amount = transactions["amount_statistics"]["mean"]
            if avg_amount < 1000:
                insights.append({
                    "type": "transaction",
                    "priority": "medium",
                    "title": "Small Transaction Amounts",
                    "message": f"Average transaction: KES {avg_amount:.0f}. Potential for growth.",
                    "recommendation": "Educate about benefits of larger investments",
                    "action": "education_campaign"
                })
        
        # Activity patterns
        if patterns.get("consistency_score", 0) < 0.5:
            insights.append({
                "type": "behavior",
                "priority": "medium",
                "title": "Inconsistent Usage Pattern",
                "message": "User activity is inconsistent. Consider habit-building features.",
                "recommendation": "Implement daily reminders or goals",
                "action": "habit_building"
            })
        
        # Feature usage insights
        feature_usage = patterns.get("feature_usage", {})
        if len(feature_usage) == 1:
            insights.append({
                "type": "feature_adoption",
                "priority": "medium",
                "title": "Limited Feature Usage",
                "message": "User only uses one feature. Opportunity for feature discovery.",
                "recommendation": "Introduce other features gradually",
                "action": "feature_tour"
            })
        
        return insights
    
    # Helper methods
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction"""
        if len(values) < 2:
            return "insufficient_data"
        
        # Simple linear regression slope
        x = np.arange(len(values))
        slope, _, _, p_value, _ = stats.linregress(x, values)
        
        if p_value > 0.05:  # Not statistically significant
            return "stable"
        elif slope > 0:
            return "increasing"
        else:
            return "decreasing"
    
    def _calculate_consistency_score(self, df: pd.DataFrame) -> float:
        """Calculate consistency score based on activity regularity"""
        daily_activity = df.groupby(df["timestamp"].dt.date)["message_count"].sum()
        cv = daily_activity.std() / daily_activity.mean() if daily_activity.mean() > 0 else float('inf')
        return max(0, 1 - min(cv, 2) / 2)  # Normalize to 0-1
    
    def _classify_engagement_pattern(self, df: pd.DataFrame) -> str:
        """Classify user engagement pattern"""
        recent_activity = df.tail(7)["message_count"].sum()
        total_activity = df["message_count"].sum()
        
        if recent_activity / max(total_activity, 1) > 0.5:
            return "recently_active"
        elif total_activity / len(df) > 3:
            return "highly_engaged"
        elif total_activity / len(df) > 1:
            return "moderately_engaged"
        else:
            return "low_engagement"
    
    def _calculate_avg_days_between_transactions(self, transactions: pd.DataFrame) -> float:
        """Calculate average days between transactions"""
        if len(transactions) < 2:
            return 0
        
        sorted_transactions = transactions.sort_values("timestamp")
        time_diffs = sorted_transactions["timestamp"].diff().dt.days.dropna()
        return time_diffs.mean()
    
    def _calculate_transaction_velocity(self, transactions: pd.DataFrame) -> Dict[str, float]:
        """Calculate transaction velocity metrics"""
        if transactions.empty:
            return {"transactions_per_day": 0, "amount_per_day": 0}
        
        time_span = (transactions["timestamp"].max() - transactions["timestamp"].min()).days
        time_span = max(time_span, 1)  # Avoid division by zero
        
        return {
            "transactions_per_day": len(transactions) / time_span,
            "amount_per_day": transactions["transaction_amount"].sum() / time_span
        }
    
    def _classify_spending_pattern(self, transactions: pd.DataFrame) -> str:
        """Classify user spending pattern"""
        amounts = transactions["transaction_amount"]
        cv = amounts.std() / amounts.mean() if amounts.mean() > 0 else 0
        
        if cv < 0.3:
            return "consistent_spender"
        elif cv > 1.0:
            return "irregular_spender"
        else:
            return "moderate_variance"
    
    def _categorize_engagement(self, engagement_rate: float) -> str:
        """Categorize engagement level"""
        if engagement_rate >= 0.8:
            return "highly_engaged"
        elif engagement_rate >= 0.5:
            return "moderately_engaged"
        elif engagement_rate >= 0.2:
            return "low_engaged"
        else:
            return "at_risk"
    
    def _engineer_features_for_prediction(self, user_data: List[Dict]) -> List[float]:
        """Engineer features for ML predictions"""
        df = pd.DataFrame(user_data)
        
        features = [
            len(user_data),  # Total sessions
            df["message_count"].sum(),  # Total messages
            df["message_count"].mean(),  # Avg messages per session
            df["session_duration"].mean(),  # Avg session duration
            len(df[df["transaction_amount"] > 0]),  # Transaction count
            df[df["transaction_amount"] > 0]["transaction_amount"].mean() or 0,  # Avg transaction
            (datetime.now() - df["timestamp"].max()).days,  # Days since last activity
            df["message_count"].std(),  # Activity variability
        ]
        
        return features
    
    def _predict_next_transaction(self, user_data: List[Dict]) -> float:
        """Predict probability of next transaction"""
        df = pd.DataFrame(user_data)
        transactions = df[df["transaction_amount"] > 0]
        
        if transactions.empty:
            return 0.1
        
        # Simple heuristic based on transaction frequency
        days_span = (df["timestamp"].max() - df["timestamp"].min()).days
        transaction_rate = len(transactions) / max(days_span, 1)
        
        return min(transaction_rate * 7, 1.0)  # Probability for next 7 days
    
    def _predict_lifetime_value(self, user_data: List[Dict]) -> float:
        """Predict user lifetime value"""
        df = pd.DataFrame(user_data)
        transactions = df[df["transaction_amount"] > 0]
        
        if transactions.empty:
            return 0
        
        avg_transaction = transactions["transaction_amount"].mean()
        transaction_frequency = len(transactions) / len(user_data)
        
        # Simple LTV calculation: avg_transaction * frequency * projected_lifetime
        projected_lifetime_days = 365  # Assume 1 year
        return avg_transaction * transaction_frequency * projected_lifetime_days
    
    def _predict_engagement(self, user_data: List[Dict]) -> Dict[str, float]:
        """Predict next week engagement"""
        df = pd.DataFrame(user_data)
        recent_trend = self._calculate_trend(df.tail(7)["message_count"].tolist())
        
        current_avg = df.tail(7)["message_count"].mean()
        
        if recent_trend == "increasing":
            predicted = current_avg * 1.2
        elif recent_trend == "decreasing":
            predicted = current_avg * 0.8
        else:
            predicted = current_avg
        
        return {
            "predicted_daily_messages": max(predicted, 0),
            "confidence": 0.6 if recent_trend != "insufficient_data" else 0.2
        }
    
    def _calculate_engagement_decline(self, df: pd.DataFrame) -> float:
        """Calculate engagement decline rate"""
        if len(df) < 14:
            return 0
        
        recent_engagement = df.tail(7)["message_count"].mean()
        previous_engagement = df.iloc[-14:-7]["message_count"].mean()
        
        if previous_engagement == 0:
            return 0
        
        decline = (previous_engagement - recent_engagement) / previous_engagement
        return max(0, decline)
    
    def _calculate_transaction_decline(self, df: pd.DataFrame) -> float:
        """Calculate transaction activity decline"""
        if len(df) < 14:
            return 0
        
        recent_transactions = len(df.tail(7)[df.tail(7)["transaction_amount"] > 0])
        previous_transactions = len(df.iloc[-14:-7][df.iloc[-14:-7]["transaction_amount"] > 0])
        
        if previous_transactions == 0:
            return 0
        
        decline = (previous_transactions - recent_transactions) / previous_transactions
        return max(0, decline)
    
    def _detect_transaction_anomalies(self, df: pd.DataFrame) -> int:
        """Detect transaction anomalies (simplified)"""
        transactions = df[df["transaction_amount"] > 0]
        
        if len(transactions) < 3:
            return 0
        
        amounts = transactions["transaction_amount"]
        q75, q25 = np.percentile(amounts, [75, 25])
        iqr = q75 - q25
        
        outliers = amounts[(amounts < (q25 - 1.5 * iqr)) | (amounts > (q75 + 1.5 * iqr))]
        return len(outliers)
    
    def _identify_risk_factors(self, df: pd.DataFrame, churn_risk: float, fraud_risk: float) -> List[str]:
        """Identify specific risk factors"""
        factors = []
        
        days_since_last = (datetime.now() - df["timestamp"].max()).days
        
        if days_since_last > 7:
            factors.append("inactive_user")
        
        if df["message_count"].tail(7).sum() < 5:
            factors.append("low_recent_engagement")
        
        if len(df[df["transaction_amount"] > 0]) == 0:
            factors.append("no_transactions")
        
        if churn_risk > 0.7:
            factors.append("high_churn_probability")
        
        if fraud_risk > 0.5:
            factors.append("transaction_anomalies")
        
        return factors
    
    async def generate_business_insights(self, time_window: int = 30) -> Dict[str, Any]:
        """Generate business-level insights and KPIs"""
        try:
            # This would typically aggregate data from all users
            # For now, we'll return sample business insights structure
            
            insights = {
                "overview": {
                    "total_active_users": 1250,
                    "new_users": 150,
                    "churn_rate": 0.08,
                    "revenue_growth": 0.15,
                    "avg_ltv": 2500
                },
                "user_segments": {
                    "highly_engaged": {"count": 300, "percentage": 24},
                    "moderately_engaged": {"count": 600, "percentage": 48},
                    "low_engaged": {"count": 250, "percentage": 20},
                    "at_risk": {"count": 100, "percentage": 8}
                },
                "transaction_insights": {
                    "total_volume": 125000,
                    "avg_transaction": 850,
                    "top_transaction_types": {"deposit": 0.6, "withdrawal": 0.3, "transfer": 0.1}
                },
                "recommendations": [
                    {
                        "priority": "high",
                        "area": "retention",
                        "action": "Focus on at-risk user re-engagement",
                        "impact": "Could prevent 50% churn"
                    },
                    {
                        "priority": "medium", 
                        "area": "growth",
                        "action": "Expand feature adoption",
                        "impact": "Increase engagement by 20%"
                    }
                ],
                "timestamp": datetime.now().isoformat()
            }
            
            return insights
            
        except Exception as e:
            logger.error("Business insights generation failed", error=str(e))
            return {"status": "error", "error": str(e)}
    
    def get_stats(self) -> Dict[str, Any]:
        """Get analytics service statistics"""
        return {
            "service": "Analytics Service",
            "models_trained": self.models_trained,
            "cache_entries": len(self.analytics_cache),
            "features": [
                "user_behavior_analysis",
                "churn_prediction", 
                "transaction_analytics",
                "engagement_metrics",
                "business_insights"
            ],
            "timestamp": datetime.now().isoformat()
        }
