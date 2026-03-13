#!/usr/bin/env python3
"""
快速启动脚本 - Quick Start
一键启动所有功能
"""

import os
import sys

TEMPLATE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TEMPLATE_DIR)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='OpenClaw Agent 快速启动')
    parser.add_argument('action', choices=['status', 'health', 'test', 'systems'], help='操作')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    parser.add_argument('-i', '--input', help='测试输入')
    
    args = parser.parse_args()
    
    if args.action == 'status':
        os.system(f'python3 {TEMPLATE_DIR}/status_panel.py')
    
    elif args.action == 'health':
        os.system(f'python3 {TEMPLATE_DIR}/health_check.py')
    
    elif args.action == 'systems':
        os.system(f'python3 {TEMPLATE_DIR}/cli.py systems')
    
    elif args.action == 'test':
        if args.input:
            os.system(f'python3 {TEMPLATE_DIR}/cli.py test -i "{args.input}"')
        else:
            print("请输入测试内容: openclaw agent test -i \"你好\"")


if __name__ == "__main__":
    main()
