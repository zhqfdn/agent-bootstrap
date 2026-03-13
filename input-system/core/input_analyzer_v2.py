#!/usr/bin/env python3
"""
增强版输入系统 - Enhanced Input System v2.0
添加更多实体类型 + 可选 LLM 增强
"""

import re
import json
import os
from enum import Enum
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field


class IntentType(Enum):
    """意图类型"""
    # 命令类
    COMMAND = "command"
    TASK = "task"
    QUESTION = "question"
    CHAT = "chat"
    CONFIRM = "confirm"
    CANCEL = "cancel"
    
    # 情感类
    COMPLAINT = "complaint"
    PRAISE = "praise"
    EMOTIONAL = "emotional"
    
    # 动作类
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    SEARCH = "search"
    EXECUTE = "execute"


class EntityType(Enum):
    """实体类型 - 增强版"""
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
    EMAIL = "email"
    PHONE = "phone"
    IP_ADDRESS = "ip_address"
    LANGUAGE = "language"


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
    llm_enhanced: bool = False


class EnhancedInputConfig:
    """增强版输入配置"""
    
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
    
    # 实体模式 - 增强版
    ENTITY_PATTERNS = {
        EntityType.TIME: re.compile(r'(\d{1,2})[时分](\d{1,2})?'),
        EntityType.DATE: re.compile(r'(\d{1,4})[年/\-](\d{1,2})[月/\-](\d{1,2})?'),
        EntityType.NUMBER: re.compile(r'\d+'),
        EntityType.CODE: re.compile(r'[`]{1,3}[^`]+[`]{1,3}'),
        EntityType.URL: re.compile(r'https?://[^\s]+'),
        EntityType.EMAIL: re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
        EntityType.PHONE: re.compile(r'1[3-9]\d{9}'),
        EntityType.IP_ADDRESS: re.compile(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'),
        EntityType.FILE: re.compile(r'[a-zA-Z]:\\[^\s]+|/[^\s]+\.[a-zA-Z]+|~/[^\s]+'),
    }
    
    # 编程语言检测
    LANGUAGE_PATTERNS = {
        "python": ["python", "py", "python3"],
        "javascript": ["javascript", "js", "node"],
        "typescript": ["typescript", "ts"],
        "java": ["java"],
        "go": ["go", "golang"],
        "rust": ["rust", "rs"],
        "c++": ["c++", "cpp", "cxx"],
        "c#": ["c#", "csharp"],
        "html": ["html", "htm"],
        "css": ["css"],
        "sql": ["sql"],
        "shell": ["shell", "bash", "sh", "zsh"],
    }


class LLMEnhancer:
    """LLM 增强器 - 可选"""
    
    def __init__(self, provider: str = "openai"):
        self.provider = provider
        self.enabled = os.environ.get("OPENCLAW_INPUT_LLM", "false").lower() == "true"
    
    def enhance(self, text: str, rule_intent: Intent) -> Intent:
        """使用 LLM 增强意图识别"""
        if not self.enabled:
            return rule_intent
        
        # 如果置信度低，尝试 LLM 增强
        if rule_intent.confidence < 0.7:
            # 这里可以接入实际的 LLM API
            # 目前是占位实现
            pass
        
        return rule_intent


class EnhancedInputAnalyzer:
    """增强版输入分析器"""
    
    def __init__(self, use_llm: bool = False):
        self.config = EnhancedInputConfig()
        self.context = {}
        self.llm_enhancer = LLMEnhancer() if use_llm else None
    
    def analyze(self, text: str, context: Dict = None) -> Intent:
        """分析输入文本，返回意图"""
        if context:
            self.context.update(context)
        
        # 1. 检查是否是命令
        if text.startswith('/'):
            return self._analyze_command(text)
        
        # 2. 识别意图类型
        intent_type = self._detect_intent(text)
        
        # 3. 提取实体（增强版）
        entities = self._extract_entities(text)
        
        # 4. 提取动作和槽位
        action, slots = self._extract_action_and_slots(text, intent_type)
        
        # 5. 计算置信度
        confidence = self._calculate_confidence(text, intent_type)
        
        # 6. 可选：LLM 增强
        intent = Intent(
            type=intent_type,
            confidence=confidence,
            action=action,
            entities=entities,
            raw_intent=intent_type.value,
            slots=slots,
        )
        
        if self.llm_enhancer:
            intent = self.llm_enhancer.enhance(text, intent)
        
        return intent
    
    def _analyze_command(self, text: str) -> Intent:
        """分析命令"""
        match = self.config.ENTITY_PATTERNS[EntityType.COMMAND] if EntityType.COMMAND in self.config.ENTITY_PATTERNS else None
        
        cmd_pattern = re.compile(r'^/(\w+)\s*(.*)$')
        match = cmd_pattern.match(text)
        
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
        
        return max(scores, key=scores.get)
    
    def _extract_entities(self, text: str) -> List[Entity]:
        """提取实体 - 增强版"""
        entities = []
        
        for entity_type, pattern in self.config.ENTITY_PATTERNS.items():
            for match in pattern.finditer(text):
                entities.append(Entity(
                    type=entity_type,
                    value=match.group(),
                    start=match.start(),
                    end=match.end(),
                ))
        
        # 检测编程语言
        text_lower = text.lower()
        for lang, keywords in self.config.LANGUAGE_PATTERNS.items():
            for kw in keywords:
                if kw in text_lower:
                    # 找到关键词位置
                    idx = text_lower.find(kw)
                    entities.append(Entity(
                        type=EntityType.LANGUAGE,
                        value=lang,
                        start=idx,
                        end=idx + len(kw),
                    ))
                    break
        
        return entities
    
    def _extract_action_and_slots(self, text: str, intent_type: IntentType) -> tuple:
        """提取动作和槽位"""
        action = None
        slots = {}
        
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
        
        words = text.split()
        keywords = [w for w in words if len(w) >= 2]
        if keywords:
            slots["keywords"] = keywords[:5]
        
        return action, slots
    
    def _calculate_confidence(self, text: str, intent_type: IntentType) -> float:
        """计算置信度"""
        base = 0.5
        keywords = self.config.INTENT_KEYWORDS.get(intent_type, [])
        matches = sum(1 for kw in keywords if kw in text.lower())
        confidence = min(0.95, base + matches * 0.15)
        
        if '?' in text or '？' in text:
            if intent_type == IntentType.QUESTION:
                confidence = min(0.95, confidence + 0.2)
        
        return confidence


# 兼容旧版
InputAnalyzer = EnhancedInputAnalyzer


if __name__ == "__main__":
    # 测试
    analyzer = EnhancedInputAnalyzer()
    
    test_inputs = [
        "帮我写一个 Python 函数",
        "查看文件 ~/Documents/test.txt",
        "执行 ls -la 命令",
        "搜索如何安装 nodejs",
        "我的邮箱是 test@example.com",
    ]
    
    for text in test_inputs:
        intent = analyzer.analyze(text)
        print(f"\n输入: {text}")
        print(f"  意图: {intent.type.value} ({intent.confidence:.0%})")
        print(f"  动作: {intent.action}")
        print(f"  实体: {[(e.type.value, e.value) for e in intent.entities]}")
