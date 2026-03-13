#!/usr/bin/env python3
"""
Cognition System CLI
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import CognitionSystem


def cmd_process(intent_json: str, args):
    """处理意图"""
    try:
        intent = json.loads(intent_json)
    except:
        intent = {"action": intent_json, "type": "default"}
    
    cognition = CognitionSystem()
    context = {"description": intent_json}
    
    result = cognition.process(intent, context)
    
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("=== 认知处理结果 ===")
        print(f"允许执行: {'✓' if result['allowed'] else '✗'}")
        
        if result.get('task'):
            task = result['task']
            print(f"\n📋 任务: {task['id']}")
            print("步骤:")
            for step in task['steps']:
                print(f"   {step['id']+1}. {step['description']} ({step['action']})")
        
        if result.get('next_step'):
            print(f"\n下一步: {result['next_step']}")
        
        if result.get('preferences'):
            p = result['preferences']
            print(f"\n风格偏好: {p.get('style')} | 详细程度: {p.get('detail')}")


def cmd_status(args):
    """查看状态"""
    cognition = CognitionSystem()
    status = cognition.get_status()
    
    if args.json:
        print(json.dumps(status, indent=2))
    else:
        print("=== 认知系统状态 ===")
        print(f"活跃任务: {'有' if status['has_task'] else '无'}")
        if status.get('task_id'):
            print(f"任务ID: {status['task_id']}")
            print(f"任务状态: {status['task_status']}")
        print(f"\n偏好设置:")
        print(f"  沟通风格: {status['preferences']['communication_style']}")
        print(f"  详细程度: {status['preferences']['detail_level']}")


def cmd_learn(feedback: str, args):
    """学习反馈"""
    cognition = CognitionSystem()
    result = cognition.learner.adjust_style(feedback)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("=== 学习反馈 ===")
        print(f"沟通风格: {result['communication_style']}")
        print(f"详细程度: {result['detail_level']}")


def cmd_decide(action: str, args):
    """决策评估"""
    cognition = CognitionSystem()
    result = cognition.decision_maker.evaluate(action, {})
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("=== 决策评估 ===")
        print(f"允许: {'✓' if result['allowed'] else '✗'}")
        print(f"原因: {result['reason']}")
        if result['warnings']:
            print(f"警告: {', '.join(result['warnings'])}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Cognition System CLI')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    
    subparsers = parser.add_subparsers(dest='command')
    
    parser_process = subparsers.add_parser('process', help='处理意图')
    parser_process.add_argument('intent', nargs='?', help='意图JSON或描述')
    
    subparsers.add_parser('status', help='查看状态')
    
    parser_learn = subparsers.add_parser('learn', help='学习反馈')
    parser_learn.add_argument('feedback', nargs='?', help='反馈内容')
    
    parser_decide = subparsers.add_parser('decide', help='决策评估')
    parser_decide.add_argument('action', nargs='?', help='要评估的行动')
    
    args = parser.parse_args()
    
    if args.command == 'process':
        cmd_process(args.intent or "task", args)
    elif args.command == 'status':
        cmd_status(args)
    elif args.command == 'learn':
        cmd_learn(args.feedback or "好", args)
    elif args.command == 'decide':
        cmd_decide(args.action or "执行任务", args)
    else:
        cmd_status(args)


if __name__ == "__main__":
    main()
