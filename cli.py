#!/usr/bin/env python3
"""
统一 CLI 入口
所有系统通过统一命令行接口访问
"""

import sys
import os
import json
import argparse

# 添加路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.unified_logger import get_logger
from utils.central_config import get_config
from orchestrator import get_orchestrator


def cmd_status(args):
    """查看整体状态"""
    orch = get_orchestrator()
    status = orch.get_overall_status()
    
    if args.json:
        print(json.dumps(status, indent=2, ensure_ascii=False))
    else:
        print("=" * 40)
        print("  乔巴 Agent 系统状态 🦌")
        print("=" * 40)
        print(f"版本: {status['version']}")
        print(f"运行时间: {status['uptime']}")
        print(f"总交互次数: {status['total_interactions']}")
        print(f"\n系统: {status['systems']['active']}/{status['systems']['enabled']} 活跃")
        print(f"更新时间: {status['timestamp']}")
        print("=" * 40)


def cmd_systems(args):
    """查看各系统状态"""
    orch = get_orchestrator()
    systems = orch.get_system_status()
    
    if args.json:
        print(json.dumps(systems, indent=2, ensure_ascii=False))
    else:
        print("=" * 40)
        print("  系统状态")
        print("=" * 40)
        
        for name, info in systems.items():
            status_emoji = "🟢" if info['enabled'] and info['status'] == 'ready' else "🔴"
            print(f"{status_emoji} {name:12} | {info['status']:12} | 上次: {info.get('last_run', 'N/A') or 'N/A'}")
        
        print("=" * 40)


def cmd_system_detail(args):
    """查看指定系统详情"""
    orch = get_orchestrator()
    info = orch.get_system_status(args.system)
    
    if args.json:
        print(json.dumps(info, indent=2, ensure_ascii=False))
    else:
        print(f"=== {args.system} ===")
        print(f"状态: {info.get('status')}")
        print(f"启用: {info.get('enabled')}")
        print(f"上次运行: {info.get('last_run')}")
        if info.get('stats'):
            print(f"统计: {json.dumps(info['stats'], ensure_ascii=False)}")


def cmd_config(args):
    """配置管理"""
    config = get_config()
    
    if args.get:
        value = config.get(args.get)
        if args.json:
            print(json.dumps(value, indent=2, ensure_ascii=False))
        else:
            print(f"{args.get} = {value}")
    
    elif args.set:
        key, value = args.set.split('=')
        key = key.strip()
        value = value.strip()
        
        # 尝试解析 JSON 值
        try:
            value = json.loads(value)
        except:
            pass
        
        config.set(key, value)
        print(f"已设置: {key} = {value}")
    
    else:
        if args.json:
            print(json.dumps(config.get_all(), indent=2, ensure_ascii=False))
        else:
            print("=== 配置 ===")
            all_config = config.get_all()
            print(json.dumps(all_config, indent=2, ensure_ascii=False))


def cmd_test(args):
    """测试完整流程"""
    orch = get_orchestrator()
    
    test_input = args.input or "你好，乔巴！"
    print(f"测试输入: {test_input}")
    
    result = orch.process_input(test_input)
    
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("=" * 40)
        print("处理结果")
        print("=" * 40)
        print(f"意图: {result['intent']['type']} ({result['intent']['confidence']:.0%})")
        print(f"允许: {result['cognition'].get('allowed', True)}")
        print(f"回复: {result['response']['content'][:100]}...")
        print("=" * 40)


def cmd_heartbeat(args):
    """触发心跳"""
    orch = get_orchestrator()
    orch.tick_heartbeat()
    print("心跳已触发")


def main():
    parser = argparse.ArgumentParser(description='OpenClaw Agent 统一 CLI')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    
    subparsers = parser.add_subparsers(dest='command', help='命令')
    
    # status 命令
    subparsers.add_parser('status', help='查看整体状态')
    
    # systems 命令
    subparsers.add_parser('systems', help='查看所有系统状态')
    
    # system 命令
    system_parser = subparsers.add_parser('system', help='查看指定系统详情')
    system_parser.add_argument('system', help='系统名称')
    
    # config 命令
    config_parser = subparsers.add_parser('config', help='配置管理')
    config_parser.add_argument('--get', help='获取配置项')
    config_parser.add_argument('--set', help='设置配置项 (key=value)')
    
    # test 命令
    test_parser = subparsers.add_parser('test', help='测试完整流程')
    test_parser.add_argument('--input', '-i', help='测试输入')
    
    # heartbeat 命令
    subparsers.add_parser('heartbeat', help='触发心跳')
    
    args = parser.parse_args()
    
    if args.command == 'status':
        cmd_status(args)
    elif args.command == 'systems':
        cmd_systems(args)
    elif args.command == 'system':
        cmd_system_detail(args)
    elif args.command == 'config':
        cmd_config(args)
    elif args.command == 'test':
        cmd_test(args)
    elif args.command == 'heartbeat':
        cmd_heartbeat(args)
    else:
        # 默认显示状态
        cmd_status(args)


if __name__ == "__main__":
    main()
