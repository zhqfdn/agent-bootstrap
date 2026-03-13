#!/usr/bin/env python3
"""
统一配置管理 - Central Config
所有系统的配置统一管理
"""

import os
import json
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime


class CentralConfig:
    """中央配置管理器"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        self._initialized = True
        
        self.workspace = Path.home() / ".openclaw" / "workspace"
        self.config_dir = self.workspace / "config"
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        self.config_file = self.config_dir / "central_config.json"
        self.config = self._load_config()
    
    def _load_config(self) -> Dict:
        """加载配置"""
        default_config = self._get_default_config()
        
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                # 合并配置
                return self._merge_config(default_config, user_config)
            except Exception as e:
                print(f"加载配置失败: {e}")
        
        # 保存默认配置
        self._save_config(default_config)
        return default_config
    
    def _get_default_config(self) -> Dict:
        """默认配置"""
        return {
            "version": "2.0",
            "last_updated": datetime.now().isoformat(),
            "agent": {
                "name": "乔巴",
                "role": "全能助手",
                "emoji": "🦌"
            },
            "memory": {
                "enabled": True,
                "daily_dir": "memory/daily",
                "longterm_dir": "memory/longterm",
                "privacy_levels": ["P0", "P1", "P2", "P3", "P4"]
            },
            "emotion": {
                "enabled": True,
                "moods": ["curious", "happy", "neutral", "tired", "stressed"],
                "decay_interval": 60,
                "mood_effects": {
                    "curious": {"detail_level": "high", "emoji": "🧐"},
                    "happy": {"detail_level": "medium", "emoji": "😊"},
                    "neutral": {"detail_level": "medium", "emoji": "😐"},
                    "tired": {"detail_level": "low", "emoji": "😴"},
                    "stressed": {"detail_level": "medium", "emoji": "😰"}
                }
            },
            "heartbeat": {
                "enabled": True,
                "pulse_interval": 5,
                "rhythm_interval": 60,
                "cycle_interval": 3600
            },
            "input": {
                "enabled": True,
                "llm_enhance": False,
                "confidence_threshold": 0.7
            },
            "output": {
                "enabled": True,
                "default_style": "friendly",
                "default_format": "text"
            },
            "bootstrap": {
                "enabled": True,
                "quick_mode": True,
                "i18n": "zh"
            },
            "logging": {
                "level": "INFO",
                "file_enabled": True,
                "console_enabled": True
            }
        }
    
    def _merge_config(self, default: Dict, user: Dict) -> Dict:
        """合并配置"""
        result = default.copy()
        
        for key, value in user.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_config(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def _save_config(self, config: Dict):
        """保存配置"""
        config["last_updated"] = datetime.now().isoformat()
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    
    def get(self, key: str, default: Any = None) -> Any:
        """获取配置"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any):
        """设置配置"""
        keys = key.split('.')
        config = self.config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        config[keys[-1]] = value
        self._save_config(self.config)
    
    def get_all(self) -> Dict:
        """获取全部配置"""
        return self.config.copy()
    
    def reset(self):
        """重置为默认配置"""
        default = self._get_default_config()
        self._save_config(default)
        self.config = default


# 全局配置实例
_config = None

def get_config() -> CentralConfig:
    """获取配置实例"""
    global _config
    if _config is None:
        _config = CentralConfig()
    return _config


# 便捷函数
def get(key: str, default: Any = None) -> Any:
    return get_config().get(key, default)

def set(key: str, value: Any):
    get_config().set(key, value)


if __name__ == "__main__":
    config = get_config()
    print("=== 中央配置 ===")
    print(f"Agent: {config.get('agent.name')}")
    print(f"情感系统: {config.get('emotion.enabled')}")
    print(f"心跳间隔: {config.get('heartbeat.pulse_interval')}s")
    print("\n全部配置:")
    print(json.dumps(config.get_all(), ensure_ascii=False, indent=2))
