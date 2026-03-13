#!/usr/bin/env python3
"""
健康检查 - Health Check
检查所有系统状态并报告问题
"""

import sys
import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.central_config import get_config


class HealthChecker:
    """健康检查器"""
    
    def __init__(self):
        self.workspace = Path.home() / ".openclaw" / "workspace"
        self.checks = []
    
    def check_workspace(self) -> Dict:
        """检查工作目录"""
        required_dirs = [
            "memory",
            "memory/daily",
            "memory/longterm",
            "config"
        ]
        
        issues = []
        for dir_path in required_dirs:
            full_path = self.workspace / dir_path
            if not full_path.exists():
                issues.append(f"目录缺失: {dir_path}")
        
        return {
            "name": "workspace",
            "status": "ok" if not issues else "warning",
            "issues": issues
        }
    
    def check_config(self) -> Dict:
        """检查配置"""
        try:
            config = get_config()
            issues = []
            
            # 检查必要配置
            if not config.get("agent.name"):
                issues.append("未设置 agent.name")
            if not config.get("agent.role"):
                issues.append("未设置 agent.role")
            
            return {
                "name": "config",
                "status": "ok" if not issues else "warning",
                "issues": issues
            }
        except Exception as e:
            return {
                "name": "config",
                "status": "error",
                "issues": [str(e)]
            }
    
    def check_memory(self) -> Dict:
        """检查记忆系统"""
        memory_dir = self.workspace / "memory"
        issues = []
        
        # 检查目录
        if not memory_dir.exists():
            issues.append("memory 目录不存在")
            return {"name": "memory", "status": "error", "issues": issues}
        
        # 检查索引
        index_file = memory_dir / ".index" / "memory.json"
        if not index_file.exists():
            issues.append("记忆索引文件不存在")
        
        return {
            "name": "memory",
            "status": "ok" if not issues else "warning",
            "issues": issues
        }
    
    def check_emotion(self) -> Dict:
        """检查情感系统"""
        emotion_dir = self.workspace / "memory" / "emotions"
        issues = []
        
        if not emotion_dir.exists():
            issues.append("emotions 目录不存在（首次运行将自动创建）")
            return {
                "name": "emotion",
                "status": "warning",
                "issues": issues
            }
        
        state_file = emotion_dir / "emotion_v2.json"
        if not state_file.exists():
            issues.append("情感状态文件不存在（首次运行将自动创建）")
        
        return {
            "name": "emotion",
            "status": "ok" if not issues else "warning",
            "issues": issues
        }
    
    def check_gateway(self) -> Dict:
        """检查 Gateway"""
        import subprocess
        
        try:
            result = subprocess.run(
                ["openclaw", "gateway", "status"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if "running" in result.stdout.lower():
                return {"name": "gateway", "status": "ok", "issues": []}
            else:
                return {"name": "gateway", "status": "warning", "issues": ["Gateway 未运行"]}
        except Exception as e:
            return {"name": "gateway", "status": "error", "issues": [str(e)]}
    
    def check_all(self) -> Dict:
        """运行所有检查"""
        checks = [
            self.check_workspace(),
            self.check_config(),
            self.check_memory(),
            self.check_emotion(),
            self.check_gateway()
        ]
        
        # 汇总结果
        ok_count = sum(1 for c in checks if c["status"] == "ok")
        warning_count = sum(1 for c in checks if c["status"] == "warning")
        error_count = sum(1 for c in checks if c["status"] == "error")
        
        overall = "ok"
        if error_count > 0:
            overall = "error"
        elif warning_count > 0:
            overall = "warning"
        
        return {
            "overall": overall,
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": len(checks),
                "ok": ok_count,
                "warning": warning_count,
                "error": error_count
            },
            "checks": checks
        }


def format_health_report(report: Dict) -> str:
    """格式化健康报告"""
    lines = [
        "╔══════════════════════════════════════════════════════════╗",
        "║           Agent 健康检查报告 🦌                           ║",
        "╠══════════════════════════════════════════════════════════╣"
    ]
    
    # 总体状态
    emoji = {"ok": "✅", "warning": "⚠️", "error": "❌"}[report["overall"]]
    lines.append(f"║  总体状态: {emoji} {report['overall'].upper():<40}║")
    lines.append(f"║  检查时间: {report['timestamp']:<40}║")
    
    summary = report["summary"]
    lines.append(f"║  通过: {summary['ok']} | 警告: {summary['warning']} | 错误: {summary['error']:<38}║")
    lines.append("╠══════════════════════════════════════════════════════════╣")
    
    # 各检查项
    for check in report["checks"]:
        emoji = {"ok": "✅", "warning": "⚠️", "error": "❌"}[check["status"]]
        lines.append(f"║  {emoji} {check['name']:<15} | {check['status']:<7}║")
        
        for issue in check.get("issues", []):
            lines.append(f"║      └─ {issue:<47}║")
    
    lines.append("╚══════════════════════════════════════════════════════════╝")
    
    return "\n".join(lines)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Agent 健康检查')
    parser.add_argument('--json', action='store_true', help='JSON 输出')
    
    args = parser.parse_args()
    
    checker = HealthChecker()
    report = checker.check_all()
    
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(format_health_report(report))
        
        # 返回码
        import sys
        if report["overall"] == "error":
            sys.exit(1)


if __name__ == "__main__":
    main()
