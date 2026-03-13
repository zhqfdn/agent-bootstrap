#!/usr/bin/env python3
"""
Input System CLI
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import InputAnalyzer


def cmd_analyze(text: str, args):
    """分析输入"""
    analyzer = InputAnalyzer()
    intent = analyzer.analyze(text)
    
    if args.json:
        result = {
            "type": intent.type.value,
            "confidence": intent.confidence,
            "action": intent.action,
            "entities": [{"type": e.type.value, "value": e.value} for e in intent.entities],
            "slots": intent.slots,
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(analyzer.get_intent_display(intent))
        
        # 打印实体详情
        if intent.entities:
            print("\n📦 实体详情:")
            for e in intent.entities:
                print(f"   {e.type.value}: {e.value}")


def cmd_interactive(args):
    """交互模式"""
    analyzer = InputAnalyzer()
    
    print("=== Input System 交互模式 ===")
    print("输入文本进行分析，输入 'quit' 退出\n")
    
    while True:
        try:
            text = input("> ").strip()
            if text.lower() in ['quit', 'exit', 'q']:
                break
            if not text:
                continue
            
            intent = analyzer.analyze(text)
            print(analyzer.get_intent_display(intent))
            print()
            
        except (KeyboardInterrupt, EOFError):
            break
    
    print("\n退出")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Input System CLI')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    parser.add_argument('-i', '--interactive', action='store_true', help='交互模式')
    
    parser.add_argument('text', nargs='?', help='要分析的文本')
    
    args = parser.parse_args()
    
    if args.interactive:
        cmd_interactive(args)
    elif args.text:
        cmd_analyze(args.text, args)
    else:
        # 默认交互模式
        cmd_interactive(args)


if __name__ == "__main__":
    main()
