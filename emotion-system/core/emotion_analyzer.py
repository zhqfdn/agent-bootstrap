"""
Emotion Analyzer - 情感分析器 (游戏化版)
根据用户输入和上下文分析情感变化
"""

import random
from .emotion_config import DEFAULT_MOODS, EMOTION_CONFIG, MOOD_BUFFS
from .emotion_store import EmotionStore


class EmotionAnalyzer:
    """情感分析器 - 游戏化版本"""
    
    # 关键词到心情的映射
    MOOD_KEYWORDS = {
        "curious": ["好奇", "想知道", "是什么", "怎么", "为什么", "?", "？", "问问", "了解一下", "?"],
        "happy": ["好", "棒", "不错", "喜欢", "谢谢", "太好了", "完美", "赞", "哈哈", "开心", "高兴"],
        "calm": ["好的", "收到", "明白", "了解", "可以", "行", "嗯", "好吧", "随意"],
        "focused": ["完成", "做好", "做好", "赶紧", "处理", "解决", "搞定", "完成"],
        "tired": ["累了", "困", "休息", "不想动", "算了", "想睡"],
        "anxious": ["怎么办", "急", "担心", "害怕", "会不会", "能不能", "紧张", "慌"],
        "excited": ["太棒了", "终于", "成功了", "太好了", "哈哈", "耶", "超棒", "牛", "太强"],
        "thoughtful": ["想想", "考虑", "分析", "评估", "看看", "研究", "思考"],
        "neutral": ["嗯嗯", "哦", "好", "收到", "知道了"],
        "sad": ["难过", "伤心", "哭", "郁闷", "烦", "不爽", "悲剧", "可惜"],
        "grateful": ["感谢", "谢谢", "感恩", "多亏", "幸好", "感激"],
    }
    
    # 情感强度词
    INTENSITY_STRONG = ["太", "非常", "特别", "超级", "极其", "绝对"]
    INTENSITY_WEAK = ["有点", "稍微", "略微", "一点"]
    
    # 正面/负面情绪词
    POSITIVE_WORDS = ["好", "棒", "赞", "喜欢", "谢谢", "开心", "高兴", "成功", "搞定", "完成", "牛", "强", "棒"]
    NEGATIVE_WORDS = ["不好", "糟", "差", "失败", "错", "问题", "麻烦", "累", "困", "烦", "难", "烦"]
    STRESS_WORDS = ["急", "担心", "害怕", "焦虑", "紧张", "慌", "压力", "烦"]
    
    def __init__(self, store: EmotionStore = None):
        self.store = store or EmotionStore()
    
    def analyze_message(self, message: str) -> dict:
        """分析用户消息，更新情感状态"""
        message_lower = message.lower()
        
        # 检测心情
        detected_mood = self._detect_mood(message_lower)
        
        # 分析情感倾向
        sentiment = self._analyze_sentiment(message_lower)
        
        # 压力检测
        stress_level = self._analyze_stress(message_lower)
        
        # 生成建议更新
        suggested = self._generate_suggested_update(detected_mood, sentiment, stress_level)
        
        return {
            "detected_mood": detected_mood,
            "sentiment": sentiment,
            "stress_level": stress_level,
            "suggested_update": suggested,
        }
    
    def _detect_mood(self, text: str) -> str:
        """检测消息对应的心情"""
        current_mood = self.store.get_state()['mood']
        config = EMOTION_CONFIG['mood']
        valid_transitions = config['transitions'].get(current_mood, DEFAULT_MOODS)
        
        scores = {mood: 0 for mood in DEFAULT_MOODS}
        
        for mood, keywords in self.MOOD_KEYWORDS.items():
            if mood not in valid_transitions and mood != current_mood:
                continue
            for keyword in keywords:
                if keyword in text:
                    # 检查情感强度
                    intensity = 1.0
                    for strong in self.INTENSITY_STRONG:
                        if strong + keyword in text:
                            intensity = 1.5
                            break
                    scores[mood] += intensity
        
        # 返回得分最高的合法转换
        max_score = max(scores.values())
        if max_score == 0:
            return current_mood
        
        candidates = [m for m in valid_transitions if scores[m] == max_score]
        if candidates:
            return random.choice(candidates)
        
        return current_mood
    
    def _analyze_sentiment(self, text: str) -> float:
        """分析情感倾向 (-1 到 1)"""
        score = 0
        
        for word in self.POSITIVE_WORDS:
            if word in text:
                score += 0.2
        
        for word in self.NEGATIVE_WORDS:
            if word in text:
                score -= 0.2
        
        # 强度修饰
        for strong in self.INTENSITY_STRONG:
            if strong in text:
                score *= 1.3
        
        for weak in self.INTENSITY_WEAK:
            if weak in text:
                score *= 0.5
        
        return max(-1.0, min(1.0, score))
    
    def _analyze_stress(self, text: str) -> float:
        """分析压力程度"""
        stress_count = sum(1 for word in self.STRESS_WORDS if word in text)
        return min(1.0, stress_count * 0.3)
    
    def _generate_suggested_update(self, mood: str, sentiment: float, stress_level: float) -> dict:
        """生成建议的状态更新"""
        updates = {"mood": mood}
        
        state = self.store.get_state()
        
        # 根据情感倾向调整压力
        if sentiment > 0.3:
            updates["stress"] = max(0, state['stress'] - 0.1)
        elif sentiment < -0.3:
            updates["stress"] = min(1.0, state['stress'] + 0.1)
        
        # 根据检测到的压力调整
        if stress_level > 0.5:
            updates["stress"] = min(1.0, state['stress'] + 0.05)
        
        return updates
    
    def should_suggest_mood_change(self, message: str) -> bool:
        """判断是否应该建议心情改变"""
        analysis = self.analyze_message(message)
        return abs(analysis['sentiment']) > 0.4
    
    def get_mood_buffs(self) -> dict:
        """获取当前心情的buff"""
        mood = self.store.get_state()['mood']
        return MOOD_BUFFS.get(mood, {})
    
    def get_emotion_display(self) -> str:
        """获取简洁情感状态展示（手机端友好）"""
        state = self.store.get_state()
        
        mood_emoji = {
            "curious": "🧐", "happy": "😊", "calm": "😌", "focused": "🎯",
            "tired": "😴", "anxious": "😰", "excited": "🤩", "thoughtful": "🤔",
            "neutral": "😐", "sad": "😢", "grateful": "🥰",
        }
        
        emoji = mood_emoji.get(state['mood'], "😐")
        level = state.get('level', 1)
        xp = state.get('xp', 0)
        
        from .emotion_config import get_title
        title = get_title(level)
        
        # 简洁版：去掉边框线条
        return f"""💖 {emoji} Lv.{level} {title}
心情: {state['mood']} | XP: {xp}
⚡能量: {int(state['energy']*100)}% | 💕连接: {int(state['connection']*100)}% | 😰压力: {int(state['stress']*100)}%"""

    def get_compact_display(self) -> str:
        """获取极简展示（手机端一行）"""
        state = self.store.get_state()
        
        mood_emoji = {
            "curious": "🧐", "happy": "😊", "calm": "😌", "focused": "🎯",
            "tired": "😴", "anxious": "😰", "excited": "🤩", "thoughtful": "🤔",
            "neutral": "😐", "sad": "😢", "grateful": "🥰",
        }
        
        emoji = mood_emoji.get(state['mood'], "😐")
        e = int(state['energy'] * 100)
        c = int(state['connection'] * 100)
        s = int(state['stress'] * 100)
        
        # 一行版本
        return f"{emoji} Lv.{state['level']} {state['mood']} ⚡{e}% 💕{c}% 😰{s}%"
