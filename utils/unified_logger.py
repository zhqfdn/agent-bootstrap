#!/usr/bin/env python3
"""
统一日志系统 - Unified Logger
所有系统使用统一的日志格式和输出
"""

import os
import sys
import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from enum import Enum


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"


class UnifiedLogger:
    """统一日志器"""
    
    _instances = {}
    
    def __new__(cls, name: str = "openclaw"):
        if name not in cls._instances:
            cls._instances[name] = super().__new__(cls)
        return cls._instances[name]
    
    def __init__(self, name: str = "openclaw"):
        if hasattr(self, '_initialized'):
            return
        self._initialized = True
        self.name = name
        self._setup_logger()
    
    def _setup_logger(self):
        """设置日志器"""
        self.logger = logging.getLogger(self.name)
        self.logger.setLevel(logging.DEBUG)
        
        # 避免重复添加 handler
        if self.logger.handlers:
            return
        
        # 控制台 handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s [%(levelname)s] %(message)s',
            datefmt='%H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # 文件 handler
        self._setup_file_handler()
    
    def _setup_file_handler(self):
        """设置文件日志"""
        log_dir = Path.home() / ".openclaw" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        
        log_file = log_dir / f"openclaw_{datetime.now().strftime('%Y-%m-%d')}.log"
        
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '%(asctime)s [%(name)s] [%(levelname)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        self.logger.addHandler(file_handler)
    
    def debug(self, message: str, system: str = None):
        """Debug 日志"""
        self._log(LogLevel.DEBUG, message, system)
    
    def info(self, message: str, system: str = None):
        """Info 日志"""
        self._log(LogLevel.INFO, message, system)
    
    def warn(self, message: str, system: str = None):
        """Warn 日志"""
        self._log(LogLevel.WARN, message, system)
    
    def error(self, message: str, system: str = None):
        """Error 日志"""
        self._log(LogLevel.ERROR, message, system)
    
    def _log(self, level: LogLevel, message: str, system: Optional[str]):
        """统一日志输出"""
        if system:
            msg = f"[{system}] {message}"
        else:
            msg = message
        
        if level == LogLevel.DEBUG:
            self.logger.debug(msg)
        elif level == LogLevel.INFO:
            self.logger.info(msg)
        elif level == LogLevel.WARN:
            self.logger.warning(msg)
        elif level == LogLevel.ERROR:
            self.logger.error(msg)
    
    def log_action(self, action: str, details: dict = None):
        """记录动作"""
        msg = f"🎯 {action}"
        if details:
            msg += f" | {json.dumps(details, ensure_ascii=False)}"
        self.info(msg, "ACTION")


# 全局日志器
def get_logger(name: str = "openclaw") -> UnifiedLogger:
    """获取日志器实例"""
    return UnifiedLogger(name)


# 便捷函数
def debug(message: str, system: str = None):
    get_logger().debug(message, system)

def info(message: str, system: str = None):
    get_logger().info(message, system)

def warn(message: str, system: str = None):
    get_logger().warn(message, system)

def error(message: str, system: str = None):
    get_logger().error(message, system)


if __name__ == "__main__":
    # 测试
    logger = get_logger("test")
    logger.info("测试日志", "test")
    logger.debug("调试信息", "test")
    logger.warn("警告信息", "test")
    logger.error("错误信息", "test")
    logger.log_action("用户登录", {"user": "船长", "time": "13:00"})
