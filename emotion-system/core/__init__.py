"""
Emotion System - OpenClaw Agent 情感系统
"""

from .emotion_store import EmotionStore
from .emotion_analyzer import EmotionAnalyzer
from .emotion_config import DEFAULT_MOODS, EMOTION_CONFIG

__all__ = ['EmotionStore', 'EmotionAnalyzer', 'DEFAULT_MOODS', 'EMOTION_CONFIG']
