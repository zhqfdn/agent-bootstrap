#!/usr/bin/env python3
"""
Agent 状态面板 - Status Panel
实时查看所有系统状态
"""

import sys
import os
import json
import time
from datetime import datetime
from pathlib import Path

# 添加当前目录到路径
TEMPLATE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(TEMPLATE_DIR, "utils"))
sys.path.insert(0, os.path.join(TEMPLATE_DIR, "emotion-system", "core"))
sys.path.insert(0, os.path.join(TEMPLATE_DIR, "memory-system", "core"))

from central_config import get_config
from emotion_v2 import get_store as get_emotion_store


def get_memory_stats():
    """获取记忆统计"""
    memory_dir = Path.home() / ".openclaw" / "workspace" / "memory"
    daily_dir = memory_dir / "daily"
    
    stats = {
        "daily_count": 0,
        "total_memories": 0
    }
    
    if daily_dir.exists():
        daily_files = list(daily_dir.glob("*.md"))
        stats["daily_count"] = len(daily_files)
    
    # 尝试读取索引
    index_file = memory_dir / ".index" / "memory.json"
    if index_file.exists():
        try:
            with open(index_file, 'r') as f:
                index = json.load(f)
                stats["total_memories"] = index.get("totalMemories", 0)
        except:
            pass
    
    return stats


def get_heartbeat_status():
    """获取心跳状态"""
    state_file = Path.home() / ".openclaw" / "workspace" / "heartbeat_state.json"
    
    if state_file.exists():
        try:
            with open(state_file, 'r') as f:
                return json.load(f)
        except:
            pass
    
    return {}


def format_status_panel():
    """格式化状态面板"""
    # 获取各系统数据
    config = get_config()
    emotion_store = get_emotion_store()
    emotion_state = emotion_store.get_state()
    mood_info = emotion_store.get_mood_info()
    memory_stats = get_memory_stats()
    heartbeat_status = get_heartbeat_status()
    
    # Agent 信息
    agent_name = config.get("agent.name", "乔巴")
    agent_role = config.get("agent.role", "全能助手")
    agent_emoji = config.get("agent.emoji", "🦌")
    
    # 计算运行时间
    try:
        import subprocess
        result = subprocess.run(
            ["openclaw", "gateway", "status"],
            capture_output=True,
            text=True,
            timeout=5
        )
        gateway_status = "运行中" if "running" in result.stdout.lower() else "未知"
    except:
        gateway_status = "未知"
    
    # 构建面板
    panel = f"""
╔══════════════════════════════════════════════════════════╗
║  {agent_name} 的状态 {agent_emoji}                                         ║
╠══════════════════════════════════════════════════════════╣
║  角色: {agent_role:<45}║
║  心情: {mood_info['emoji']} {mood_info['mood']:<10} | 详细程度: {mood_info['detail_level']:<6}  ║
║  能量: {int(emotion_state['energy']*100):<3}%        | 连接感: {int(emotion_state['connection']*100):<3}%        | 压力: {int(emotion_state['stress']*100):<3}%     ║
╠══════════════════════════════════════════════════════════╣
║  📊 系统状态                                               ║
║  ─────────────────────────────────────────────────────   ║
║  记忆: {memory_stats.get('total_memories', 0):<3} 条     | 今日文件: {memory_stats.get('daily_count', 0):<2} 个                    ║
║  心跳: {heartbeat_status.get('last_pulse', 'N/A'):<25}   ║
║  网关: {gateway_status:<47}║
╚══════════════════════════════════════════════════════════╝
"""
    return panel


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Agent 状态面板')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    parser.add_argument('--compact', action='store_true', help='简洁模式')
    
    args = parser.parse_args()
    
    if args.json:
        # JSON 输出
        config = get_config()
        emotion_store = get_emotion_store()
        memory_stats = get_memory_stats()
        heartbeat_status = get_heartbeat_status()
        
        output = {
            "agent": {
                "name": config.get("agent.name"),
                "role": config.get("agent.role"),
                "emoji": config.get("agent.emoji")
            },
            "emotion": emotion_store.get_state(),
            "memory": memory_stats,
            "heartbeat": heartbeat_status,
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
    
    elif args.compact:
        # 简洁模式
        emotion_store = get_emotion_store()
        mood_info = emotion_store.get_mood_info()
        state = emotion_store.get_state()
        
        print(f"{mood_info['emoji']} {mood_info['mood']} | ⚡{int(state['energy']*100)}% | 💕{int(state['connection']*100)}%")
    
    else:
        # 完整面板
        print(format_status_panel())


if __name__ == "__main__":
    main()
