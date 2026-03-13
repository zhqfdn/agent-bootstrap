#!/usr/bin/env python3
"""
Heartbeat System CLI
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import HeartbeatSystem


def cmd_status(args):
    """查看心跳状态"""
    hb = HeartbeatSystem()
    status = hb.get_status()
    
    print("=== Heartbeat Status ===")
    print(f"Running: {status['running']}")
    print(f"Last runs:")
    for task, time in status['last_run'].items():
        print(f"  {task}: {time}")
    
    if args.json:
        print(json.dumps(status, indent=2))


def cmd_run(args):
    """运行心跳"""
    if args.once:
        hb = HeartbeatSystem()
        hb.tick()
        print("✓ Heartbeat tick completed")
    else:
        print("Starting daemon mode...")
        hb = HeartbeatSystem()
        hb.start()


def cmd_integration(args):
    """集成到 OpenClaw"""
    print("=== Heartbeat Integration ===")
    print()
    print("方式1: 使用 cron 定时调用")
    print(f"  */1 * * * * python3 {os.path.dirname(os.path.abspath(__file__))}/main.py run --once")
    print()
    print("方式2: 使用 OpenClaw 内置定时任务")
    print("  配置 gateway.cron jobs")
    print()
    print("推荐: 使用 cron 每分钟运行一次")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Heartbeat System CLI')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    
    subparsers = parser.add_subparsers(dest='command')
    
    subparsers.add_parser('status', help='查看状态')
    
    parser_run = subparsers.add_parser('run', help='运行心跳')
    parser_run.add_argument('--once', action='store_true', help='运行一次')
    
    subparsers.add_parser('integration', help='集成说明')
    
    args = parser.parse_args()
    
    if args.command == 'status':
        cmd_status(args)
    elif args.command == 'run':
        cmd_run(args)
    elif args.command == 'integration':
        cmd_integration(args)
    else:
        # 默认显示状态
        cmd_status(args)


if __name__ == "__main__":
    main()
