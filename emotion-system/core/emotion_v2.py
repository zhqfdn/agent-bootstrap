#!/usr/bin/env python3
"""
简化版情感系统 - Simplified Emotion System v2.0
保留游戏化初心，简化复杂度
"""

import json
import os
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

# 简化版心情定义
SIMPLE_MOODS = {
    "curious": {"emoji": "🧐", "detail_level": "high"},
    "happy": {"emoji": "😊", "detail_level": "medium"},
    "neutral": {"emoji": "😐", "detail_level": "medium"},
    "tired": {"emoji": "😴", "detail_level": "low"},
    "stressed": {"emoji": "😰", "detail_level": "medium"}
}

# 心情转换矩阵
MOOD_TRANSITIONS = {
    "curious": ["happy", "neutral"],
    "happy": ["curious", "neutral", "tired"],
    "neutral": ["curious", "happy", "tired", "stressed"],
    "tired": ["neutral", "stressed"],
    "stressed": ["neutral", "tired"]
}

# 心情对输出的影响
MOOD_EFFECTS = {
    "curious": {"detail_level": "high", "emoji": "🧐", "prefix": "让我帮你分析一下"},
    "happy": {"detail_level": "medium", "emoji": "😊", "prefix": "好的！"},
    "neutral": {"detail_level": "medium", "emoji": "😐", "prefix": "明白"},
    "tired": {"detail_level": "low", "emoji": "😴", "prefix": "嗯..."},
    "stressed": {"detail_level": "medium", "emoji": "😰", "prefix": "别急，我来处理"}
}


class SimplifiedEmotionStore:
    """简化版情感存储器"""
    
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            home = os.path.expanduser("~/.openclaw/workspace")
            data_dir = os.path.join(home, "memory", "emotions")
        
        self.data_dir = Path(data_dir)
        self.state_file = self.data_dir / "emotion_v2.json"
        
        self._ensure_directories()
        self.state = self._load_state()
    
    def _ensure_directories(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    def _load_state(self) -> Dict:
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        # 默认状态
        return {
            "mood": "neutral",
            "energy": 0.8,       # 0-1 能量值
            "connection": 0.5,    # 0-1 与用户连接感
            "stress": 0.1,       # 0-1 压力值
            "mood_streak": 0,    # 心情持续时间
            "last_update": datetime.now().isoformat()
        }
    
    def _save_state(self):
        self.state["last_update"] = datetime.now().isoformat()
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, ensure_ascii=False, indent=2)
    
    def get_state(self) -> Dict:
        return self.state.copy()
    
    def get_mood_info(self) -> Dict:
        """获取心情信息"""
        mood = self.state.get("mood", "neutral")
        return {
            "mood": mood,
            "emoji": MOOD_EFFECTS.get(mood, {}).get("emoji", "😐"),
            "detail_level": MOOD_EFFECTS.get(mood, {}).get("detail_level", "medium"),
            "prefix": MOOD_EFFECTS.get(mood, {}).get("prefix", "")
        }
    
    def on_interaction_start(self):
        """互动开始"""
        self.state["energy"] = max(0.3, self.state.get("energy", 0.8) - 0.02)
        self._save_state()
    
    def on_interaction_end(self, success: bool = True):
        """互动结束"""
        if success:
            self.state["energy"] = min(1.0, self.state.get("energy", 0.8) + 0.05)
            self.state["connection"] = min(1.0, self.state.get("connection", 0.5) + 0.03)
            self.state["stress"] = max(0, self.state.get("stress", 0.1) - 0.02)
        else:
            self.state["stress"] = min(1.0, self.state.get("stress", 0.1) + 0.05)
        
        # 随机可能改变心情
        self._maybe_change_mood()
        self._save_state()
    
    def _maybe_change_mood(self):
        """随机改变心情"""
        current = self.state.get("mood", "neutral")
        streak = self.state.get("mood_streak", 0)
        
        # 能量低容易疲倦
        if self.state.get("energy", 0.8) < 0.3 and current != "tired":
            if random.random() < 0.5:
                self.state["mood"] = "tired"
                self.state["mood_streak"] = 0
                return
        
        # 压力高容易焦虑
        if self.state.get("stress", 0.1) > 0.6 and current != "stressed":
            if random.random() < 0.5:
                self.state["mood"] = "stressed"
                self.state["mood_streak"] = 0
                return
        
        # 正常心情波动
        if streak >= 3:
            if random.random() < 0.3:
                valid = MOOD_TRANSITIONS.get(current, ["neutral"])
                self.state["mood"] = random.choice(valid)
                self.state["mood_streak"] = 0
            else:
                self.state["mood_streak"] = streak + 1
        else:
            self.state["mood_streak"] = streak + 1
    
    def decay(self):
        """自然衰减"""
        # 能量衰减
        self.state["energy"] = max(0.3, self.state.get("energy", 0.8) - 0.01)
        
        # 连接感衰减
        self.state["connection"] = max(0.2, self.state.get("connection", 0.5) - 0.005)
        
        # 压力自然恢复
        self.state["stress"] = max(0, self.state.get("stress", 0.1) - 0.01)
        
        # 心情波动
        self._maybe_change_mood()
        
        self._save_state()
    
    def boost(self, reason: str = "用户互动"):
        """提升连接感"""
        self.state["connection"] = min(1.0, self.state.get("connection", 0.5) + 0.05)
        self._save_state()
    
    def get_display(self) -> str:
        """获取显示字符串"""
        mood_info = self.get_mood_info()
        energy = int(self.state.get("energy", 0.8) * 100)
        connection = int(self.state.get("connection", 0.5) * 100)
        stress = int(self.state.get("stress", 0.1) * 100)
        
        return f"{mood_info['emoji']} {mood_info['mood']} | ⚡{energy}% | 💕{connection}% | 😰{stress}%"
    
    def reset(self):
        """重置"""
        self.state = {
            "mood": "neutral",
            "energy": 0.8,
            "connection": 0.5,
            "stress": 0.1,
            "mood_streak": 0,
            "last_update": datetime.now().isoformat()
        }
        self._save_state()


# 便捷函数
_store = None

def get_store() -> SimplifiedEmotionStore:
    global _store
    if _store is None:
        _store = SimplifiedEmotionStore()
    return _store


if __name__ == "__main__":
    store = get_store()
    print("=== 情感状态 v2.0 ===")
    print(store.get_display())
    print("\n心情信息:", store.get_mood_info())
