#!/usr/bin/env python3
"""
简化版情感系统 CLI
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.emotion_v2 import get_store, SIMPLE_MOODS, MOOD_EFFECTS


def cmd_state(args):
    """查看状态"""
    store = get_store()
    state = store.get_state()
    mood_info = store.get_mood_info()
    
    if args.json:
        print(json.dumps({
            "state": state,
            "mood_info": mood_info
        }, ensure_ascii=False, indent=2))
    else:
        print("=" * 40)
        print(f"  情感状态 v2.0 🦌")
        print("=" * 40)
        print(f"心情: {mood_info['emoji']} {mood_info['mood']}")
        print(f"详细程度: {mood_info['detail_level']}")
        print(f"能量: {int(state['energy']*100)}%")
        print(f"连接感: {int(state['connection']*100)}%")
        print(f"压力: {int(state['stress']*100)}%")
        print("=" * 40)


def cmd_boost(args):
    """提升连接感"""
    store = get_store()
    store.boost()
    print("连接感已提升")
    print(store.get_display())


def cmd_decay(args):
    """自然衰减"""
    store = get_store()
    store.decay()
    print("已衰减")
    print(store.get_display())


def cmd_interaction(args, success: bool):
    """互动开始/结束"""
    store = get_store()
    if args.start:
        store.on_interaction_start()
        print("互动开始")
    else:
        store.on_interaction_end(success)
        print(f"互动结束 (成功: {success})")
    print(store.get_display())


def cmd_moods(args):
    """查看所有心情"""
    if args.json:
        print(json.dumps(MOOD_EFFECTS, ensure_ascii=False, indent=2))
    else:
        print("=== 可用心情 ===")
        for mood, info in MOOD_EFFECTS.items():
            print(f"{info['emoji']} {mood:10} | 详细: {info['detail_level']:6} | {info['prefix']}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='简化情感系统 v2.0')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    
    subparsers = parser.add_subparsers(dest='command')
    
    subparsers.add_parser('state', help='查看情感状态')
    subparsers.add_parser('boost', help='提升连接感')
    subparsers.add_parser('decay', help='自然衰减')
    subparsers.add_parser('moods', help='查看所有心情')
    
    # 互动
    inter_parser = subparsers.add_parser('interaction', help='互动处理')
    inter_parser.add_argument('--start', action='store_true', help='互动开始')
    inter_parser.add_argument('--success', action='store_true', help='互动成功')
    inter_parser.add_argument('--fail', action='store_true', help='互动失败')
    
    args = parser.parse_args()
    
    if args.command == 'state':
        cmd_state(args)
    elif args.command == 'boost':
        cmd_boost(args)
    elif args.command == 'decay':
        cmd_decay(args)
    elif args.command == 'moods':
        cmd_moods(args)
    elif args.command == 'interaction':
        cmd_interaction(args, args.success)
    else:
        cmd_state(args)


if __name__ == "__main__":
    main()
