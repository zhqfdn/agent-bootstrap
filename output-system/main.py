#!/usr/bin/env python3
"""
Output System CLI
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import OutputSystem, OutputStyle, OutputFormat


def cmd_response(content: str, args):
    """生成回复"""
    output = OutputSystem()
    
    style = OutputStyle(args.style) if args.style else OutputStyle.FRIENDLY
    output_format = OutputFormat(args.format) if args.format else OutputFormat.TEXT
    
    result = output.generate_response(content, style, output_format, args.template)
    
    if args.json:
        print(json.dumps({
            "content": result.content,
            "style": result.style.value,
            "format": result.format.value,
            "metadata": result.metadata,
        }, indent=2, ensure_ascii=False))
    else:
        print(result.content)


def cmd_action(action: str, params_json: str, args):
    """执行行动"""
    output = OutputSystem()
    
    try:
        params = json.loads(params_json) if params_json else {}
    except:
        params = {"raw": params_json}
    
    result = output.execute_action(action, params)
    
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        if result.get("success"):
            print(f"✓ {action} 执行成功")
            if result.get("path"):
                print(f"  路径: {result['path']}")
        else:
            print(f"✗ {action} 执行失败: {result.get('error')}")


def cmd_format(content: str, args):
    """格式化内容"""
    output = OutputSystem()
    
    output_format = OutputFormat(args.format) if args.format else OutputFormat.TEXT
    result = output.format_result(content, output_format)
    
    print(result)


def cmd_status(args):
    """查看状态"""
    output = OutputSystem()
    status = output.get_status()
    
    if args.json:
        print(json.dumps(status, indent=2))
    else:
        print("=== 输出系统状态 ===")
        print(f"默认风格: {status['default_style']}")
        print(f"默认格式: {status['default_format']}")
        print(f"\n可用行动:")
        for action in status['available_actions']:
            print(f"  • {action}")


def cmd_list(items: str, args):
    """格式化列表"""
    output = OutputSystem()
    
    items_list = [i.strip() for i in items.split(',')]
    result = output.generator.format_list(items_list, args.numbered)
    
    print(result)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Output System CLI')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    parser.add_argument('--style', choices=['direct', 'friendly', 'formal', 'casual', 'technical'], help='输出风格')
    parser.add_argument('--format', choices=['text', 'markdown', 'code', 'json', 'table', 'list'], help='输出格式')
    parser.add_argument('--template', default='result', help='回复模板')
    parser.add_argument('--numbered', action='store_true', help='编号列表')
    
    subparsers = parser.add_subparsers(dest='command')
    
    parser_response = subparsers.add_parser('response', help='生成回复')
    parser_response.add_argument('content', nargs='?', help='回复内容')
    
    parser_action = subparsers.add_parser('action', help='执行行动')
    parser_action.add_argument('action', nargs='?', help='行动类型')
    parser_action.add_argument('params', nargs='?', help='行动参数(JSON)')
    
    parser_format = subparsers.add_parser('format', help='格式化内容')
    parser_format.add_argument('content', nargs='?', help='内容')
    
    subparsers.add_parser('status', help='查看状态')
    
    parser_list = subparsers.add_parser('list', help='格式化列表')
    parser_list.add_argument('items', nargs='?', help='用逗号分隔的项目')
    
    args = parser.parse_args()
    
    if args.command == 'response':
        cmd_response(args.content or "你好", args)
    elif args.command == 'action':
        cmd_action(args.action or "file.read", args.params or "{}", args)
    elif args.command == 'format':
        cmd_format(args.content or "{}", args)
    elif args.command == 'status':
        cmd_status(args)
    elif args.command == 'list':
        cmd_list(args.items or "a,b,c", args)
    else:
        cmd_status(args)


if __name__ == "__main__":
    main()
