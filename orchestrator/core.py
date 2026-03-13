#!/usr/bin/env python3
"""
统一调度器 - Core Orchestrator
统一调度所有系统，协调各模块工作
"""

import os
import sys
import time
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum

# 添加路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.unified_logger import get_logger
from utils.central_config import get_config


class SystemStatus(Enum):
    """系统状态"""
    UNINITIALIZED = "uninitialized"
    INITIALIZING = "initializing"
    READY = "ready"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class SystemInfo:
    """系统信息"""
    name: str
    status: SystemStatus = SystemStatus.UNINITIALIZED
    enabled: bool = True
    last_run: Optional[str] = None
    error: Optional[str] = None
    stats: Dict[str, Any] = field(default_factory=dict)


class CoreOrchestrator:
    """核心调度器 - 统一协调所有系统"""
    
    def __init__(self):
        self.logger = get_logger("orchestrator")
        self.config = get_config()
        
        # 系统注册表
        self.systems: Dict[str, SystemInfo] = {}
        
        # 统一状态存储
        self.state_file = Path.home() / ".openclaw" / "workspace" / "orchestrator_state.json"
        self.state = self._load_state()
        
        # 初始化所有系统
        self._register_systems()
        
        self.logger.info("核心调度器初始化完成")
    
    def _load_state(self) -> Dict:
        """加载状态"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            "started_at": datetime.now().isoformat(),
            "last_update": datetime.now().isoformat(),
            "systems": {},
            "total_interactions": 0
        }
    
    def _save_state(self):
        """保存状态"""
        self.state["last_update"] = datetime.now().isoformat()
        
        # 保存各系统状态
        for name, info in self.systems.items():
            self.state["systems"][name] = {
                "status": info.status.value,
                "enabled": info.enabled,
                "last_run": info.last_run,
                "stats": info.stats
            }
        
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, ensure_ascii=False, indent=2)
    
    def _register_systems(self):
        """注册所有系统"""
        system_configs = [
            ("memory", "memory-system"),
            ("emotion", "emotion-system"),
            ("heartbeat", "heartbeat-system"),
            ("input", "input-system"),
            ("output", "output-system"),
            ("cognition", "cognition-system"),
            ("bootstrap", "bootstrap-system")
        ]
        
        for name, config_key in system_configs:
            enabled = self.config.get(f"{config_key.replace('-', '.')}.enabled", True)
            self.systems[name] = SystemInfo(
                name=name,
                enabled=enabled,
                status=SystemStatus.READY if enabled else SystemStatus.STOPPED
            )
            
            if enabled:
                self.logger.info(f"系统已注册: {name}")
    
    def process_input(self, user_input: str, context: Dict = None) -> Dict:
        """处理用户输入的完整流程"""
        self.logger.info(f"处理输入: {user_input[:50]}...")
        
        # 1. 输入系统 - 意图识别
        intent = self._process_input_system(user_input)
        
        # 2. 认知系统 - 推理规划
        cognition_result = self._process_cognition_system(intent, context or {})
        
        # 3. 情感系统 - 更新情感
        self._process_emotion_system(user_input)
        
        # 4. 生成输出
        response = self._process_output_system(cognition_result)
        
        # 更新统计
        self.state["total_interactions"] += 1
        self._save_state()
        
        return {
            "intent": intent,
            "cognition": cognition_result,
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
    
    def _process_input_system(self, user_input: str) -> Dict:
        """处理输入系统"""
        system = self.systems.get("input")
        if not system or not system.enabled:
            return {"type": "chat", "confidence": 0.5}
        
        try:
            # 动态导入
            sys.path.insert(0, str(Path(__file__).parent.parent / "input-system"))
            from core.input_analyzer import InputAnalyzer
            
            analyzer = InputAnalyzer()
            intent = analyzer.analyze(user_input)
            
            system.last_run = datetime.now().isoformat()
            system.stats["last_intent"] = intent.type.value
            
            return {
                "type": intent.type.value,
                "confidence": intent.confidence,
                "action": intent.action,
                "entities": [{"type": e.type.value, "value": e.value} for e in intent.entities]
            }
        except Exception as e:
            self.logger.error(f"输入系统错误: {e}", "input")
            return {"type": "chat", "confidence": 0.5, "error": str(e)}
    
    def _process_cognition_system(self, intent: Dict, context: Dict) -> Dict:
        """处理认知系统"""
        system = self.systems.get("cognition")
        if not system or not system.enabled:
            return {"allowed": True, "action": intent.get("action")}
        
        try:
            sys.path.insert(0, str(Path(__file__).parent.parent / "cognition-system"))
            from core.cognition_system import CognitionSystem
            
            cognition = CognitionSystem()
            result = cognition.process(intent, context)
            
            system.last_run = datetime.now().isoformat()
            
            return result
        except Exception as e:
            self.logger.error(f"认知系统错误: {e}", "cognition")
            return {"allowed": True, "error": str(e)}
    
    def _process_emotion_system(self, user_input: str):
        """处理情感系统"""
        system = self.systems.get("emotion")
        if not system or not system.enabled:
            return
        
        try:
            sys.path.insert(0, str(Path(__file__).parent.parent / "emotion-system"))
            from core.emotion_store import EmotionStore
            from core.emotion_analyzer import EmotionAnalyzer
            
            store = EmotionStore()
            analyzer = EmotionAnalyzer(store)
            
            # 分析消息
            result = analyzer.analyze_message(user_input)
            store.update(result.get('suggested_update', {}), "用户互动")
            
            system.last_run = datetime.now().isoformat()
            system.stats["current_mood"] = store.state.get("mood", "neutral")
            
        except Exception as e:
            self.logger.error(f"情感系统错误: {e}", "emotion")
    
    def _process_output_system(self, cognition_result: Dict) -> Dict:
        """处理输出系统"""
        system = self.systems.get("output")
        if not system or not system.enabled:
            return {"content": "处理完成", "format": "text"}
        
        try:
            sys.path.insert(0, str(Path(__file__).parent.parent / "output-system"))
            from core.output_system import OutputSystem, OutputStyle
            
            output = OutputSystem()
            
            # 根据认知结果生成输出
            content = cognition_result.get("response", "处理完成")
            style = OutputStyle.FRIENDLY
            
            result = output.generate_response(content, style)
            
            system.last_run = datetime.now().isoformat()
            
            return {
                "content": result.content,
                "format": result.format.value,
                "style": result.style.value
            }
        except Exception as e:
            self.logger.error(f"输出系统错误: {e}", "output")
            return {"content": "处理完成", "format": "text", "error": str(e)}
    
    def tick_heartbeat(self):
        """心跳触发"""
        system = self.systems.get("heartbeat")
        if not system or not system.enabled:
            return
        
        try:
            sys.path.insert(0, str(Path(__file__).parent.parent / "heartbeat-system"))
            from core.heartbeat import HeartbeatSystem
            
            hb = HeartbeatSystem()
            hb.tick()
            
            system.last_run = datetime.now().isoformat()
            
        except Exception as e:
            self.logger.error(f"心跳系统错误: {e}", "heartbeat")
    
    def get_system_status(self, system_name: str = None) -> Dict:
        """获取系统状态"""
        if system_name:
            system = self.systems.get(system_name)
            if not system:
                return {"error": "系统不存在"}
            
            return {
                "name": system.name,
                "status": system.status.value,
                "enabled": system.enabled,
                "last_run": system.last_run,
                "stats": system.stats
            }
        
        # 返回所有系统状态
        return {
            name: {
                "status": info.status.value,
                "enabled": info.enabled,
                "last_run": info.last_run
            }
            for name, info in self.systems.items()
        }
    
    def get_overall_status(self) -> Dict:
        """获取整体状态"""
        active_count = sum(1 for s in self.systems.values() if s.enabled and s.status == SystemStatus.READY)
        
        return {
            "version": "2.0",
            "uptime": self.state.get("started_at"),
            "total_interactions": self.state.get("total_interactions", 0),
            "systems": {
                "total": len(self.systems),
                "active": active_count,
                "enabled": sum(1 for s in self.systems.values() if s.enabled)
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def enable_system(self, system_name: str):
        """启用系统"""
        if system_name in self.systems:
            self.systems[system_name].enabled = True
            self.systems[system_name].status = SystemStatus.READY
            self.logger.info(f"系统已启用: {system_name}")
    
    def disable_system(self, system_name: str):
        """禁用系统"""
        if system_name in self.systems:
            self.systems[system_name].enabled = False
            self.systems[system_name].status = SystemStatus.STOPPED
            self.logger.info(f"系统已禁用: {system_name}")


# 全局实例
_orchestrator = None

def get_orchestrator() -> CoreOrchestrator:
    """获取调度器实例"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = CoreOrchestrator()
    return _orchestrator


if __name__ == "__main__":
    # 测试
    orch = get_orchestrator()
    print("=== 核心调度器状态 ===")
    print(json.dumps(orch.get_overall_status(), indent=2, ensure_ascii=False))
    print("\n=== 系统状态 ===")
    print(json.dumps(orch.get_system_status(), indent=2, ensure_ascii=False))
