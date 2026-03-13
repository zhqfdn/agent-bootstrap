#!/usr/bin/env python3
"""
Config - 配置管理模块
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

WORKSPACE = Path("/Users/openclaw/.openclaw/workspace")
CONFIG_FILE = WORKSPACE / ".openclaw" / "config.json"


@dataclass
class MemoryConfig:
    """记忆系统配置"""
    # 存储路径
    memory_dir: str = "~/.openclaw/workspace/memory"
    archive_dir: str = "~/.openclaw/workspace/memory/archive"
    
    # 遗忘规则
    dormant_days: int = 30
    archive_days: int = 90
    min_emotion_forget: float = 0.3
    
    # 索引
    enable_index: bool = True
    index_rebuild_interval: int = 3600  # 秒
    
    # 自动保存
    auto_save_enabled: bool = True
    auto_save_events: list = None
    
    # 隐私
    default_privacy: str = "P3"
    
    def __post_init__(self):
        if self.auto_save_events is None:
            self.auto_save_events = [
                "bootstrap_complete",
                "preference_set",
                "important_decision",
                "conversation"
            ]


class Config:
    """配置管理器"""
    
    _instance = None
    _config: Dict = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance
    
    def _load(self):
        """加载配置"""
        # 默认配置
        self._config = {
            "memory": {
                "memory_dir": str(WORKSPACE / "memory"),
                "archive_dir": str(WORKSPACE / "memory" / "archive"),
                "dormant_days": 30,
                "archive_days": 90,
                "min_emotion_forget": 0.3,
            },
            "index": {
                "enabled": True,
                "rebuild_interval": 3600,
            },
            "auto_save": {
                "enabled": True,
                "events": [
                    "bootstrap_complete",
                    "preference_set", 
                    "important_decision",
                    "conversation"
                ]
            },
            "privacy": {
                "default_level": "P3"
            }
        }
        
        # 尝试读取用户配置
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, 'r') as f:
                    user_config = json.load(f)
                    self._config.update(user_config)
            except:
                pass
    
    def get(self, key: str, default: Any = None) -> Any:
        """获取配置"""
        keys = key.split(".")
        value = self._config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default
        return value if value is not None else default
    
    def set(self, key: str, value: Any):
        """设置配置"""
        keys = key.split(".")
        target = self._config
        for k in keys[:-1]:
            target = target.setdefault(k, {})
        target[keys[-1]] = value
    
    def save(self):
        """保存配置"""
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(self._config, f, indent=2)
    
    def get_memory_config(self) -> MemoryConfig:
        """获取记忆配置"""
        mc = self._config.get("memory", {})
        return MemoryConfig(
            memory_dir=mc.get("memory_dir", "~/.openclaw/workspace/memory"),
            archive_dir=mc.get("archive_dir", "~/.openclaw/workspace/memory/archive"),
            dormant_days=mc.get("dormant_days", 30),
            archive_days=mc.get("archive_days", 90),
            min_emotion_forget=mc.get("min_emotion_forget", 0.3),
        )


# 单例
_config = None

def get_config() -> Config:
    """获取配置实例"""
    global _config
    if _config is None:
        _config = Config()
    return _config


if __name__ == "__main__":
    config = get_config()
    print("=== 当前配置 ===")
    print(json.dumps(config._config, indent=2))
