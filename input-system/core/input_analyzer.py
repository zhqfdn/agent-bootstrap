"""
Input System - 输入感知与意图识别系统
负责理解用户输入：意图识别、实体提取、情感分析、上下文理解
"""

import re
import json
from enum import Enum
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field


class IntentType(Enum):
    """意图类型"""
    # 命令类
    COMMAND = "command"          # 命令（如 /help）
    TASK = "task"                # 任务请求
    QUESTION = "question"         # 提问
    CHAT = "chat"                # 闲聊
    CONFIRM = "confirm"          # 确认
    CANCEL = "cancel"            # 取消
    
    # 情感类
    COMPLAINT = "complaint"      # 抱怨
    PRAISE = "praise"            # 表扬
    EMOTIONAL = "emotional"      # 情绪表达
    
    # 动作类
    CREATE = "create"            # 创建
    READ = "read"                # 读取
    UPDATE = "update"            # 更新
    DELETE = "delete"            # 删除
    SEARCH = "search"            # 搜索
    EXECUTE = "execute"          # 执行


class EntityType(Enum):
    """实体类型"""
    PERSON = "person"
    TIME = "time"
    DATE = "date"
    LOCATION = "location"
    COMMAND = "command"
    CODE = "code"
    FILE = "file"
    URL = "url"
    NUMBER = "number"
    KEYWORD = "keyword"


@dataclass
class Entity:
    """提取的实体"""
    type: EntityType
    value: str
    start: int
    end: int
    confidence: float = 1.0


@dataclass
class Intent:
    """识别出的意图"""
    type: IntentType
    confidence: float
    action: Optional[str] = None
    entities: List[Entity] = field(default_factory=list)
    raw_intent: str = ""
    slots: Dict[str, Any] = field(default_factory=dict)


class InputConfig:
    """输入系统配置"""
    
    # 意图关键词映射
    INTENT_KEYWORDS = {
        IntentType.COMMAND: ["/", "命令", "执行"],
        IntentType.TASK: ["做", "完成", "处理", "帮我", "要你"],
        IntentType.QUESTION: ["什么", "怎么", "如何", "为什么", "?", "？", "是不是", "有没有"],
        IntentType.CHAT: ["好", "嗯", "啊", "哈", "嘿", "哟"],
        IntentType.CONFIRM: ["好的", "可以", "是的", "对", "同意"],
        IntentType.CANCEL: ["算了", "不要", "取消", "算了"],
        IntentType.COMPLAINT: ["不好", "太差", "不满意", "生气", "怒"],
        IntentType.PRAISE: ["好棒", "赞", "不错", "喜欢", "谢谢"],
        IntentType.EMOTIONAL: ["开心", "难过", "累", "困", "烦"],
        IntentType.CREATE: ["新建", "创建", "添加", "写"],
        IntentType.READ: ["查看", "看看", "找", "读"],
        IntentType.UPDATE: ["修改", "更新", "改", "编辑"],
        IntentType.DELETE: ["删除", "去掉", "清除"],
        IntentType.SEARCH: ["搜索", "找找", "查一下"],
        IntentType.EXECUTE: ["运行", "执行", "跑", "启动"],
    }
    
    # 命令模式
    COMMAND_PATTERN = re.compile(r'^/(\w+)\s*(.*)$')
    
    # 实体模式
    ENTITY_PATTERNS = {
        EntityType.TIME: re.compile(r'(\d{1,2})[时分](\d{1,2})?'),
        EntityType.DATE: re.compile(r'(\d{1,4})[年/\-](\d{1,2})[月/\-](\d{1,2})?'),
        EntityType.NUMBER: re.compile(r'\d+'),
        EntityType.CODE: re.compile(r'[`]{1,3}[^`]+[`]{1,3}'),
        EntityType.URL: re.compile(r'https?://[^\s]+'),
        EntityType.FILE: re.compile(r'[a-zA-Z]:\\[^\s]+|/[^\s]+\.[a-zA-Z]+|~/[^\s]+'),
    }


class InputAnalyzer:
    """输入分析器"""
    
    def __init__(self):
        self.config = InputConfig()
        self.context = {}
    
    def analyze(self, text: str, context: Dict = None) -> Intent:
        """分析输入文本，返回意图"""
        if context:
            self.context.update(context)
        
        # 1. 检查是否是命令
        if text.startswith('/'):
            return self._analyze_command(text)
        
        # 2. 识别意图类型
        intent_type = self._detect_intent(text)
        
        # 3. 提取实体
        entities = self._extract_entities(text)
        
        # 4. 提取动作和槽位
        action, slots = self._extract_action_and_slots(text, intent_type)
        
        # 5. 计算置信度
        confidence = self._calculate_confidence(text, intent_type)
        
        return Intent(
            type=intent_type,
            confidence=confidence,
            action=action,
            entities=entities,
            raw_intent=intent_type.value,
            slots=slots,
        )
    
    def _analyze_command(self, text: str) -> Intent:
        """分析命令"""
        match = self.config.COMMAND_PATTERN.match(text)
        if match:
            cmd, args = match.groups()
            entities = [Entity(
                type=EntityType.COMMAND,
                value=cmd,
                start=1,
                end=len(cmd)+1,
            )]
            
            return Intent(
                type=IntentType.COMMAND,
                confidence=1.0,
                action=cmd,
                entities=entities,
                slots={"args": args.strip()},
            )
        
        return Intent(
            type=IntentType.COMMAND,
            confidence=0.5,
            action=text[1:].split()[0] if text else "",
        )
    
    def _detect_intent(self, text: str) -> IntentType:
        """检测意图类型"""
        text_lower = text.lower()
        scores = {}
        
        for intent_type, keywords in self.config.INTENT_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[intent_type] = score
        
        if not scores:
            return IntentType.CHAT
        
        # 返回得分最高的意图
        return max(scores, key=scores.get)
    
    def _extract_entities(self, text: str) -> List[Entity]:
        """提取实体"""
        entities = []
        
        for entity_type, pattern in self.config.ENTITY_PATTERNS.items():
            for match in pattern.finditer(text):
                entities.append(Entity(
                    type=entity_type,
                    value=match.group(),
                    start=match.start(),
                    end=match.end(),
                ))
        
        return entities
    
    def _extract_action_and_slots(self, text: str, intent_type: IntentType) -> tuple:
        """提取动作和槽位"""
        # 简单实现：提取第一个动词作为动作
        action = None
        slots = {}
        
        # 常见动作词
        action_words = {
            "做": "do", "完成": "complete", "处理": "process",
            "查看": "view", "找": "find", "搜索": "search",
            "创建": "create", "新建": "create", "删除": "delete",
            "修改": "update", "执行": "execute", "运行": "run",
        }
        
        for word, action_name in action_words.items():
            if word in text:
                action = action_name
                break
        
        # 提取关键词作为槽位
        words = text.split()
        keywords = [w for w in words if len(w) >= 2]
        if keywords:
            slots["keywords"] = keywords[:5]
        
        return action, slots
    
    def _calculate_confidence(self, text: str, intent_type: IntentType) -> float:
        """计算置信度"""
        base = 0.5
        
        # 关键词匹配增加置信度
        keywords = self.config.INTENT_KEYWORDS.get(intent_type, [])
        matches = sum(1 for kw in keywords if kw in text.lower())
        
        confidence = min(0.95, base + matches * 0.15)
        
        # 问号增加置信度
        if '?' in text or '？' in text:
            if intent_type == IntentType.QUESTION:
                confidence = min(0.95, confidence + 0.2)
        
        return confidence
    
    def get_intent_display(self, intent: Intent) -> str:
        """获取意图展示"""
        emoji_map = {
            IntentType.COMMAND: "⚡",
            IntentType.TASK: "📋",
            IntentType.QUESTION: "❓",
            IntentType.CHAT: "💬",
            IntentType.CONFIRM: "✅",
            IntentType.CANCEL: "❌",
            IntentType.COMPLAINT: "😤",
            IntentType.PRAISE: "👍",
            IntentType.EMOTIONAL: "💕",
            IntentType.CREATE: "➕",
            IntentType.READ: "👁️",
            IntentType.UPDATE: "✏️",
            IntentType.DELETE: "🗑️",
            IntentType.SEARCH: "🔍",
            IntentType.EXECUTE: "▶️",
        }
        
        emoji = emoji_map.get(intent.type, "❓")
        
        lines = [
            f"{emoji} 意图: {intent.type.value}",
            f"   置信度: {intent.confidence:.0%}",
        ]
        
        if intent.action:
            lines.append(f"   动作: {intent.action}")
        
        if intent.entities:
            lines.append(f"   实体: {', '.join(e.value for e in intent.entities[:3])}")
        
        return '\n'.join(lines)
