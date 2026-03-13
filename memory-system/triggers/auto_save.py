#!/usr/bin/env python3
"""
Auto Save Trigger - 自动保存触发器
根据事件自动保存记忆
"""

import os
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable
from pathlib import Path

# 导入核心模块
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from core.memory_store import get_store
from core.memory_index import get_index


class AutoSaver:
    """自动保存触发器"""
    
    # 触发事件类型
    EVENTS = {
        "bootstrap_complete": {"emotion": 0.9, "tags": ["bootstrap", "重要"]},
        "user_greeting": {"emotion": 0.6, "tags": ["互动", "对话"]},
        "preference_set": {"emotion": 0.7, "tags": ["偏好", "设置"]},
        "important_decision": {"emotion": 0.8, "tags": ["重要", "决策"]},
        "skill_learned": {"emotion": 0.7, "tags": ["学习", "技能"]},
        "error_occurred": {"emotion": 0.4, "tags": ["错误", "问题"]},
        "conversation": {"emotion": 0.3, "tags": ["对话"]},
        "file_operation": {"emotion": 0.5, "tags": ["文件", "操作"]},
        "code_execution": {"emotion": 0.5, "tags": ["代码", "执行"]},
    }
    
    def __init__(self):
        self.store = get_store()
        self.index = get_index()
        self.callbacks: List[Callable] = []
    
    def trigger(self, event_type: str, content: str, 
                metadata: Dict = None, tags: List[str] = None,
                emotion: float = None, privacy: str = "P3") -> str:
        """
        触发记忆保存
        
        Args:
            event_type: 事件类型 (见 EVENTS)
            content: 记忆内容
            metadata: 额外元数据
            tags: 自定义标签
            emotion: 自定义情感值
            privacy: 隐私级别
        
        Returns:
            memory_id
        """
        # 获取事件配置
        event_config = self.EVENTS.get(event_type, {})
        
        # 合并标签
        final_tags = list(event_config.get("tags", []))
        if tags:
            final_tags.extend(tags)
        
        # 情感值
        final_emotion = emotion if emotion is not None else event_config.get("emotion", 0.5)
        
        # 保存记忆
        memory_id = self.save_memory(
            content=content,
            memory_type=self._get_memory_type(event_type),
            tags=final_tags,
            emotion_level=final_emotion,
            privacy_level=privacy,
            metadata=metadata
        )
        
        # 触发回调
        self._notify_callbacks(event_type, memory_id)
        
        return memory_id
    
    def _get_memory_type(self, event_type: str) -> str:
        """根据事件类型确定记忆类型"""
        type_map = {
            "bootstrap_complete": "episodic",
            "user_greeting": "episodic",
            "preference_set": "semantic",
            "important_decision": "episodic",
            "skill_learned": "semantic",
            "error_occurred": "episodic",
            "conversation": "episodic",
            "file_operation": "procedural",
            "code_execution": "procedural",
        }
        return type_map.get(event_type, "episodic")
    
    def save_memory(self, content: str, memory_type: str = "episodic",
                    tags: List[str] = None, emotion_level: float = 0.5,
                    privacy_level: str = "P3", metadata: Dict = None) -> str:
        """保存记忆"""
        return self.store.save_daily_memory(
            content=content,
            memory_type=memory_type,
            tags=tags,
            emotion_level=emotion_level,
            privacy_level=privacy_level,
            metadata=metadata
        )
    
    def save_preferences(self, prefs: Dict):
        """保存偏好"""
        self.store.update_preferences(prefs)
        
        # 触发记忆
        self.trigger("preference_set", f"更新偏好: {list(prefs.keys())}")
    
    def save_identity(self, identity: Dict):
        """保存身份信息"""
        self.store.save_identity(identity)
        
        # 触发记忆
        self.trigger("bootstrap_complete", 
                    f"初始化完成: {identity.get('name')} - {identity.get('role')}")
    
    def register_callback(self, callback: Callable):
        """注册回调"""
        self.callbacks.append(callback)
    
    def _notify_callbacks(self, event_type: str, memory_id: str):
        """通知回调"""
        for cb in self.callbacks:
            try:
                cb(event_type, memory_id)
            except Exception as e:
                print(f"回调执行失败: {e}")
    
    def get_recent_events(self, count: int = 10) -> List[Dict]:
        """获取最近的事件"""
        from core.memory_load import get_loader
        loader = get_loader()
        memories = loader.load_recent_memories(count)
        return memories


# 便捷函数
def on_event(event_type: str, content: str, **kwargs):
    """快速触发事件"""
    saver = AutoSaver()
    return saver.trigger(event_type, content, **kwargs)


# 单例
_saver = None

def get_saver() -> AutoSaver:
    """获取自动保存器实例"""
    global _saver
    if _saver is None:
        _saver = AutoSaver()
    return _saver


if __name__ == "__main__":
    saver = get_saver()
    
    # 测试触发
    print("=== 测试自动保存 ===")
    
    # 模拟初始化
    saver.save_identity({"name": "乔巴", "role": "AI助手"})
    
    # 模拟对话
    saver.trigger("user_greeting", "用户打招呼: 你好")
    
    # 模拟设置偏好
    saver.save_preferences({"communicationStyle": "直接简洁"})
    
    print("记忆已保存")
    
    # 查看最近
    print("\n=== 最近记忆 ===")
    for m in saver.get_recent_events(5):
        print(f"- {m.get('content', '')[:50]}")
