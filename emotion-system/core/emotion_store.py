"""
Emotion Store - 情感状态持久化存储 (游戏化版)
"""

import json
import os
import random
from datetime import datetime
from pathlib import Path
from .emotion_config import EMOTION_STATE, EMOTION_CONFIG, get_title


class EmotionStore:
    """情感状态存储器 - 游戏化版本"""
    
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            home = os.path.expanduser("~/.openclaw/workspace")
            data_dir = os.path.join(home, "memory", "emotions")
        
        self.data_dir = Path(data_dir)
        self.state_file = self.data_dir / "current_state.json"
        self.history_file = self.data_dir / "history.jsonl"
        
        self._ensure_directories()
        self.state = self._load_state()
    
    def _ensure_directories(self):
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    def _load_state(self) -> dict:
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        
        state = EMOTION_STATE.copy()
        state['last_update'] = datetime.now().isoformat()
        return state
    
    def _save_state(self):
        self.state['last_update'] = datetime.now().isoformat()
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, ensure_ascii=False, indent=2)
    
    def _append_history(self, old_state: dict, new_state: dict, reason: str = None):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "reason": reason,
            "old": old_state,
            "new": new_state,
        }
        with open(self.history_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    
    def get_state(self) -> dict:
        return self.state.copy()
    
    def update(self, updates: dict, reason: str = None) -> dict:
        old_state = self.state.copy()
        
        for key, value in updates.items():
            if key in self.state and key in EMOTION_CONFIG:
                config = EMOTION_CONFIG[key]
                if isinstance(value, (int, float)) and 'min' in config:
                    self.state[key] = max(config['min'], min(config['max'], value))
                elif isinstance(value, str) and 'transitions' in config:
                    # 心情转换
                    current = self.state.get('mood')
                    valid = config['transitions'].get(current, [])
                    if value in valid or value == current:
                        self.state[key] = value
                        self.state['mood_streak'] = 0  # 重置计数
        
        self._save_state()
        self._append_history(old_state, self.state, reason)
        
        return self.state.copy()
    
    def adjust(self, key: str, delta: float, reason: str = None) -> dict:
        if key not in self.state or key not in EMOTION_CONFIG:
            return self.state.copy()
        
        config = EMOTION_CONFIG[key]
        if 'min' not in config:
            return self.state.copy()
        
        current = self.state[key]
        
        # 单次变化限制
        if 'max_increase' in config:
            delta = max(-config['max_increase'], min(config['max_increase'], delta))
        
        new_value = current + delta
        new_value = max(config['min'], min(config['max'], new_value))
        
        return self.update({key: new_value}, reason)
    
    def set_mood(self, mood: str, reason: str = None) -> dict:
        """设置心情（带转换验证）"""
        config = EMOTION_CONFIG['mood']
        current = self.state.get('mood')
        
        valid = config['transitions'].get(current, [])
        if mood in valid or mood == current:
            return self.update({'mood': mood, 'mood_streak': 0}, reason)
        return self.state.copy()
    
    def maybe_change_mood(self, reason: str = None) -> dict:
        """随机可能改变心情（模拟情感波动）"""
        config = EMOTION_CONFIG['mood']
        current = self.state.get('mood', 'neutral')
        streak = self.state.get('mood_streak', 0)
        
        # 检查是否满足改变条件
        if streak >= config.get('min_duration', 3):
            # 30%概率改变
            if random.random() < config.get('emotion_decay', 0.3):
                valid = config['transitions'].get(current, [])
                if valid:
                    new_mood = random.choice(valid)
                    self.state['mood_streak'] = 0
                    return self.update({'mood': new_mood}, reason or "情感波动")
        
        self.state['mood_streak'] = streak + 1
        self._save_state()
        return self.state.copy()
    
    def boost_connection(self, reason: str = "用户互动") -> dict:
        """提升连接感（有上限）"""
        config = EMOTION_CONFIG['connection']
        boost = config['boost_on_interaction']
        
        # 检查是否超过单次上限
        if self.state['connection'] + boost > config.get('max_single_boost', 0.15):
            boost = config['max_single_boost'] - (self.state['connection'] - 0.5)
            boost = max(0, min(boost, config['max_single_boost']))
        
        return self.adjust('connection', boost, reason)
    
    def on_interaction_start(self):
        return self.adjust('energy', -0.03, "开始互动")
    
    def on_interaction_end(self, success: bool = True):
        if success:
            self.adjust('energy', 0.08, "互动成功")
            self.adjust('stress', -EMOTION_CONFIG['stress']['decrease_on_success'], "互动成功")
            self.add_xp(EMOTION_CONFIG['xp']['gain_on_interaction'], "互动")
        else:
            self.adjust('stress', EMOTION_CONFIG['stress']['increase_on_error'], "互动失败")
    
    def add_xp(self, amount: int, reason: str = None):
        """添加经验值"""
        old_level = self.state.get('level', 1)
        self.state['xp'] = self.state.get('xp', 0) + amount
        
        # 检查升级
        xp_needed = EMOTION_CONFIG['xp']['level_up']
        while self.state['xp'] >= xp_needed * self.state['level']:
            self.state['level'] += 1
        
        if self.state['level'] > old_level:
            self._append_history(
                {"level": old_level}, 
                {"level": self.state['level']}, 
                f"升级! {reason}"
            )
    
    def decay(self):
        """自然衰减"""
        # 能量衰减
        config = EMOTION_CONFIG['energy']
        min_energy = config.get('min_on_idle', 0.2)
        if self.state['energy'] > min_energy:
            self.adjust('energy', -config['decay_rate'], "自然衰减")
        
        # 连接感衰减
        config = EMOTION_CONFIG['connection']
        self.adjust('connection', -config['decay_rate'], "自然衰减")
        
        # 压力自然恢复（平静心情时）
        if self.state.get('mood') == 'calm':
            self.adjust('stress', -EMOTION_CONFIG['stress']['natural_recover'], "平静恢复")
        
        # 心情随机波动
        self.maybe_change_mood("心跳衰减")
    
    def get_status_summary(self) -> str:
        """获取状态摘要"""
        state = self.state
        level = state.get('level', 1)
        xp = state.get('xp', 0)
        xp_needed = EMOTION_CONFIG['xp']['level_up']
        
        return f"Lv.{level} {get_title(level)} | XP: {xp}/{xp_needed*level} | " \
               f"💡{int(state['energy']*100)}% | 💕{int(state['connection']*100)}% | 😰{int(state['stress']*100)}%"
    
    def get_history(self, limit: int = 10) -> list:
        if not self.history_file.exists():
            return []
        
        history = []
        try:
            with open(self.history_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for line in reversed(lines[-limit:]):
                    try:
                        history.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        pass
        except IOError:
            pass
        
        return list(reversed(history))
    
    def reset(self):
        old_state = self.state.copy()
        self.state = EMOTION_STATE.copy()
        self.state['last_update'] = datetime.now().isoformat()
        self._save_state()
        self._append_history(old_state, self.state, "重置")
