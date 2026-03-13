"""
Heartbeat System - 心跳系统
定时执行维护任务：状态同步、情感衰减、垃圾清理
"""

import os
import sys
import time
import json
import logging
from datetime import datetime
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [heartbeat] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


class HeartbeatConfig:
    """心跳配置"""
    
    # 心跳间隔（秒）
    PULSE_INTERVAL = 5        # 脉冲层：5秒
    RHYTHM_INTERVAL = 60      # 节律层：1分钟
    CYCLE_INTERVAL = 3600    # 周期层：1小时
    
    # 存储路径
    WORKSPACE_DIR = os.path.expanduser("~/.openclaw/workspace")
    MEMORY_DIR = os.path.join(WORKSPACE_DIR, "memory")
    EMOTION_DIR = os.path.join(MEMORY_DIR, "emotions")
    STATE_FILE = os.path.join(WORKSPACE_DIR, "heartbeat_state.json")
    
    # 任务开关
    TASKS = {
        "pulse": True,       # 存活确认
        "rhythm": True,      # 情感衰减、状态保存
        "cycle": True,      # 记忆整理、深度清理
    }


class HeartbeatTask:
    """心跳任务基类"""
    
    name = "base"
    
    def should_run(self, elapsed: int, last_run: int) -> bool:
        """判断是否应该执行"""
        return elapsed >= last_run
    
    def run(self) -> bool:
        """执行任务，返回是否成功"""
        raise NotImplementedError


class PulseTask(HeartbeatTask):
    """脉冲层任务：存活确认"""
    
    name = "pulse"
    interval = HeartbeatConfig.PULSE_INTERVAL
    
    def run(self) -> bool:
        # 简单确认存活
        return True


class RhythmTask(HeartbeatTask):
    """节律层任务：情感衰减、状态保存"""
    
    name = "rhythm"
    interval = HeartbeatConfig.RHYTHM_INTERVAL
    
    def run(self) -> bool:
        try:
            # 调用情感系统衰减
            self._emotion_decay()
            # 更新最后运行时间
            self._update_state()
            return True
        except Exception as e:
            logger.error(f"Rhythm task failed: {e}")
            return False
    
    def _emotion_decay(self):
        """情感衰减"""
        emotion_script = os.path.join(
            HeartbeatConfig.WORKSPACE_DIR,
            "templates/emotion-system/main.py"
        )
        if os.path.exists(emotion_script):
            os.system(f'python3 "{emotion_script}" decay > /dev/null 2>&1')
    
    def _update_state(self):
        """更新状态"""
        state = self._load_state()
        state['last_rhythm'] = datetime.now().isoformat()
        self._save_state(state)
    
    def _load_state(self) -> dict:
        if os.path.exists(HeartbeatConfig.STATE_FILE):
            with open(HeartbeatConfig.STATE_FILE, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_state(self, state: dict):
        with open(HeartbeatConfig.STATE_FILE, 'w') as f:
            json.dump(state, f, indent=2)


class CycleTask(HeartbeatTask):
    """周期层任务：记忆整理、深度清理"""
    
    name = "cycle"
    interval = HeartbeatConfig.CYCLE_INTERVAL
    
    def run(self) -> bool:
        try:
            self._cleanup_old_files()
            self._update_state()
            return True
        except Exception as e:
            logger.error(f"Cycle task failed: {e}")
            return False
    
    def _cleanup_old_files(self):
        """清理旧文件"""
        # 清理临时文件
        temp_patterns = ['*.tmp', '*.cache', '__pycache__']
        
        # 清理 memory/archive 中的旧记忆（超过90天）
        archive_dir = os.path.join(HeartbeatConfig.MEMORY_DIR, "archive")
        if os.path.exists(archive_dir):
            # 这里可以添加更复杂的清理逻辑
            pass
    
    def _update_state(self):
        state = self._load_state()
        state['last_cycle'] = datetime.now().isoformat()
        self._save_state(state)
    
    def _load_state(self) -> dict:
        if os.path.exists(HeartbeatConfig.STATE_FILE):
            with open(HeartbeatConfig.STATE_FILE, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_state(self, state: dict):
        with open(HeartbeatConfig.STATE_FILE, 'w') as f:
            json.dump(state, f, indent=2)


class HeartbeatSystem:
    """心跳系统主控制器"""
    
    def __init__(self):
        self.config = HeartbeatConfig()
        self.tasks = {
            'pulse': PulseTask(),
            'rhythm': RhythmTask(),
            'cycle': CycleTask(),
        }
        
        self.state = self._load_state()
        self.running = False
        
        # 记录各层最后运行时间
        self.last_run = {
            'pulse': 0,
            'rhythm': 0,
            'cycle': 0,
        }
    
    def _load_state(self) -> dict:
        if os.path.exists(self.config.STATE_FILE):
            with open(self.config.STATE_FILE, 'r') as f:
                return json.load(f)
        return {
            'start_time': datetime.now().isoformat(),
            'last_pulse': None,
            'last_rhythm': None,
            'last_cycle': None,
        }
    
    def _save_state(self):
        with open(self.config.STATE_FILE, 'w') as f:
            json.dump(self.state, f, indent=2)
    
    def _update_last_run(self, task_name: str):
        self.last_run[task_name] = time.time()
        self.state[f'last_{task_name}'] = datetime.now().isoformat()
        self._save_state()
    
    def tick(self):
        """执行一次心跳"""
        elapsed = time.time()
        
        for task_name, task in self.tasks.items():
            interval = getattr(task, 'interval', 5)
            
            if elapsed - self.last_run.get(task_name, 0) >= interval:
                if task.run():
                    self._update_last_run(task_name)
                    logger.info(f"{task_name} task completed")
    
    def start(self, max_iterations: int = None):
        """启动心跳循环"""
        self.running = True
        iteration = 0
        
        logger.info("Heartbeat system started")
        
        while self.running:
            self.tick()
            
            iteration += 1
            if max_iterations and iteration >= max_iterations:
                break
            
            time.sleep(self.config.PULSE_INTERVAL)
        
        logger.info("Heartbeat system stopped")
    
    def stop(self):
        """停止心跳"""
        self.running = False
    
    def get_status(self) -> dict:
        """获取状态"""
        return {
            'running': self.running,
            'last_run': self.last_run,
            'state': self.state,
        }


def run_once():
    """运行一次心跳（用于测试）"""
    hb = HeartbeatSystem()
    hb.tick()
    print(json.dumps(hb.get_status(), indent=2))


def run_daemon():
    """作为守护进程运行"""
    hb = HeartbeatSystem()
    hb.start()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Heartbeat System')
    parser.add_argument('--once', action='store_true', help='运行一次')
    parser.add_argument('--daemon', action='store_true', help='守护进程模式')
    
    args = parser.parse_args()
    
    if args.once:
        run_once()
    elif args.daemon:
        run_daemon()
    else:
        run_once()
