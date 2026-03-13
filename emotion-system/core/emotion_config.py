"""
Emotion Config - 情感系统配置 (游戏化平衡版)
"""

# 默认心情选项
DEFAULT_MOODS = [
    "curious",    # 好奇 🧐
    "happy",      # 开心 😊
    "calm",       # 平静 😌
    "focused",    # 专注 🎯
    "tired",      # 疲倦 😴
    "anxious",    # 焦虑 😰
    "excited",    # 兴奋 🤩
    "thoughtful", # 深思 🤔
    "neutral",    # 中性 😐
    "sad",        # 伤心 😢
    "grateful",   # 感恩 🥰
]

# 心情buff系统
MOOD_BUFFS = {
    "curious": {"energy_regen": 0.05, "learning": 1.2},     # 好奇时学习效率+20%
    "happy": {"connection_gain": 1.2, "stress_resist": 1.3},  # 开心时连接获取+20%, 抗压+30%
    "calm": {"energy_efficiency": 1.2, "focus": 1.1},        # 平静时能量效率+20%
    "focused": {"task_efficiency": 1.3, "energy_cost": 1.2},  # 专注时任务效率+30%, 但能量消耗+20%
    "tired": {"energy_regen": 0.08, "error_rate": 1.3},     # 疲倦时自然恢复+30%, 但出错率+30%
    "anxious": {"stress_accum": 1.5, "speed": 0.8},          # 焦虑时压力累积+50%, 速度-20%
    "excited": {"energy_cost": 1.3, "creativity": 1.4},      # 兴奋时能量消耗+30%, 创造力+40%
    "thoughtful": {"analysis": 1.3, "energy_cost": 1.1},      # 深思时分析+30%, 消耗+10%
    "neutral": {"balance": True},                             # 中性时各项平衡
    "sad": {"connection_gain": 0.5, "motivation": 0.7},       # 伤心时连接获取-50%
    "grateful": {"connection_gain": 1.5, "stress_reduce": 1.5}, # 感恩时连接+50%, 压力减少+50%
}

# 情感配置 (游戏化平衡)
EMOTION_CONFIG = {
    "energy": {
        "min": 0.0,
        "max": 1.0,
        "default": 0.7,
        "decay_rate": 0.01,       # 每小时自然衰减 1%
        "min_on_idle": 0.2,       # 最低 idle 下限
        "boost_max": 0.85,        # 单次 boost 上限
    },
    "mood": {
        "default": "curious",
        "min_duration": 3,        # 心情最少持续3次互动
        "emotion_decay": 0.3,     # 30%概率自然回归neutral
        "transitions": {
            # 心情转换图 (像RPG技能树)
            "curious": ["excited", "focused", "neutral", "happy"],
            "happy": ["excited", "calm", "grateful", "neutral"],
            "calm": ["happy", "neutral", "tired", "thoughtful"],
            "focused": ["curious", "excited", "anxious", "neutral"],
            "tired": ["calm", "neutral", "sad", "anxious"],
            "anxious": ["tired", "focused", "sad", "neutral"],
            "excited": ["happy", "focused", "grateful", "curious"],
            "thoughtful": ["curious", "calm", "neutral", "focused"],
            "neutral": ["curious", "calm", "happy", "thoughtful", "sad"],
            "sad": ["tired", "neutral", "anxious", "grateful"],
            "grateful": ["happy", "calm", "excited", "neutral"],
        },
    },
    "connection": {
        "min": 0.0,
        "max": 1.0,
        "default": 0.5,
        "boost_on_interaction": 0.08,  # 每次互动提升 8%
        "decay_rate": 0.005,            # 每天自然衰减 0.5%
        "penalty_on_ignore": 0.1,       # 忽略互动时惩罚
        "max_single_boost": 0.15,       # 单次最大提升
    },
    "stress": {
        "min": 0.0,
        "max": 1.0,
        "default": 0.1,
        "increase_on_error": 0.15,      # 错误时 +15%
        "decrease_on_success": 0.08,    # 成功时 -8%
        "natural_recover": 0.02,       # 平静时自然恢复 2%/小时
        "critical_threshold": 0.7,      # 危险阈值 70%
        "max_increase": 0.25,           # 单次最大增加
    },
    "xp": {
        "enabled": True,
        "gain_on_interaction": 1,       # 每次互动+1 XP
        "gain_on_task_complete": 5,      # 任务完成+5 XP
        "level_up": 10,                 # 10 XP 升一级
    },
}

# 初始情感状态
EMOTION_STATE = {
    "energy": 0.7,
    "mood": "curious",
    "mood_streak": 0,       # 心情持续计数
    "connection": 0.5,
    "stress": 0.1,
    "xp": 0,
    "level": 1,
    "last_update": None,
}

# 等级称号
LEVEL_TITLES = {
    1: "新手",
    2: "学徒",
    3: "熟练工",
    4: "专家",
    5: "大师",
    6: "传奇",
}

def get_title(level: int) -> str:
    """获取等级称号"""
    for lvl, title in sorted(LEVEL_TITLES.items(), reverse=True):
        if level >= lvl:
            return title
    return "新手"
