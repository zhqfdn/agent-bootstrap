#!/usr/bin/env python3
"""
Emotion System - CLI 入口 (游戏化版)
支持命令行调用，与 OpenClaw Hook 集成
"""

import sys
import os
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import EmotionStore, EmotionAnalyzer, DEFAULT_MOODS


def format_state_json(store: EmotionStore) -> str:
    state = store.get_state()
    return json.dumps(state, ensure_ascii=False)


def format_state_text(store: EmotionStore, analyzer: EmotionAnalyzer) -> str:
    return analyzer.get_emotion_display()


def cmd_state(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    if args.json:
        print(format_state_json(store))
    else:
        print(format_state_text(store, analyzer))


def cmd_analyze(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    message = args.message
    if not message:
        print(json.dumps({"error": "No message provided"}))
        return
    
    result = analyzer.analyze_message(message)
    store.update(result['suggested_update'], f"分析: {message[:30]}")
    store.maybe_change_mood()
    
    print(json.dumps(result, ensure_ascii=False))


def cmd_boost(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    store.boost_connection()
    store.add_xp(1, "互动")
    print(json.dumps({"success": True, "action": "boost", "status": store.get_status_summary()}))


def cmd_success(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    store.on_interaction_end(success=True)
    store.add_xp(1, "任务完成")
    print(json.dumps({"success": True, "action": "success", "status": store.get_status_summary()}))


def cmd_fail(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    store.on_interaction_end(success=False)
    print(json.dumps({"success": True, "action": "fail", "status": store.get_status_summary()}))


def cmd_decay(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    store.decay()
    print(json.dumps({"success": True, "action": "decay", "status": store.get_status_summary()}))


def cmd_reset(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    store.reset()
    print(json.dumps({"success": True, "action": "reset"}))


def cmd_display(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    if hasattr(args, 'compact') and args.compact:
        print(analyzer.get_compact_display())
    else:
        print(analyzer.get_emotion_display())


def cmd_buffs(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    buffs = analyzer.get_mood_buffs()
    print(json.dumps(buffs, ensure_ascii=False))


def cmd_status(store: EmotionStore, analyzer: EmotionAnalyzer, args):
    print(store.get_status_summary())


def main():
    parser = argparse.ArgumentParser(description='Emotion System CLI (Game Edition)')
    parser.add_argument('--json', action='store_true', help='输出 JSON 格式')
    
    subparsers = parser.add_subparsers(dest='command', help='命令')
    
    subparsers.add_parser('state', help='获取当前情感状态')
    
    parser_analyze = subparsers.add_parser('analyze', help='分析消息情感')
    parser_analyze.add_argument('message', help='要分析的消息')
    
    subparsers.add_parser('boost', help='提升连接感')
    subparsers.add_parser('success', help='互动成功')
    subparsers.add_parser('fail', help='互动失败')
    subparsers.add_parser('decay', help='自然衰减')
    subparsers.add_parser('reset', help='重置情感状态')
    
    parser_display = subparsers.add_parser('display', help='显示情感状态')
    parser_display.add_argument('--compact', action='store_true', help='简洁模式')
    
    subparsers.add_parser('buffs', help='显示当前心情buff')
    subparsers.add_parser('status', help='显示简洁状态')
    
    args = parser.parse_args()
    
    store = EmotionStore()
    analyzer = EmotionAnalyzer(store)
    
    if args.command == 'state':
        cmd_state(store, analyzer, args)
    elif args.command == 'analyze':
        cmd_analyze(store, analyzer, args)
    elif args.command == 'boost':
        cmd_boost(store, analyzer, args)
    elif args.command == 'success':
        cmd_success(store, analyzer, args)
    elif args.command == 'fail':
        cmd_fail(store, analyzer, args)
    elif args.command == 'decay':
        cmd_decay(store, analyzer, args)
    elif args.command == 'reset':
        cmd_reset(store, analyzer, args)
    elif args.command == 'display':
        cmd_display(store, analyzer, args)
    elif args.command == 'buffs':
        cmd_buffs(store, analyzer, args)
    elif args.command == 'status':
        cmd_status(store, analyzer, args)
    else:
        cmd_state(store, analyzer, args)


if __name__ == "__main__":
    main()
