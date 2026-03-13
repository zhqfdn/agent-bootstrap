"""
Output System - 输出执行系统
负责：语言生成、行动执行、反馈收集、多模态输出
"""

import json
import os
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class OutputFormat(Enum):
    """输出格式"""
    TEXT = "text"           # 纯文本
    MARKDOWN = "markdown"   # Markdown
    CODE = "code"          # 代码块
    JSON = "json"          # JSON
    TABLE = "table"        # 表格
    LIST = "list"          # 列表


class OutputStyle(Enum):
    """输出风格"""
    DIRECT = "direct"           # 直接简洁
    FRIENDLY = "friendly"      # 友好亲切
    FORMAL = "formal"          # 正式规范
    CASUAL = "casual"          # 轻松随意
    TECHNICAL = "technical"    # 技术专业


@dataclass
class OutputContent:
    """输出内容"""
    format: OutputFormat = OutputFormat.TEXT
    style: OutputStyle = OutputStyle.FRIENDLY
    content: str = ""
    metadata: Dict = field(default_factory=dict)
    attachments: List[Dict] = field(default_factory=list)


class ResponseGenerator:
    """回复生成器"""
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict:
        """加载回复模板"""
        return {
            OutputStyle.DIRECT: {
                "greeting": "{greeting}",
                "result": "{result}",
                "error": "错误: {error}",
                "confirm": "完成",
            },
            OutputStyle.FRIENDLY: {
                "greeting": "你好呀！{greeting}",
                "result": "搞定啦！{result}",
                "error": "哎呀，出错了... {error}",
                "confirm": "好的，已经完成了～",
            },
            OutputStyle.CASUAL: {
                "greeting": "嘿！{greeting}",
                "result": "好了～ {result}",
                "error": "呃... {error}",
                "confirm": "OK！",
            },
        }
    
    def generate(self, content: str, style: OutputStyle, template_type: str = "result") -> str:
        """生成回复"""
        templates = self.templates.get(style, self.templates[OutputStyle.FRIENDLY])
        template = templates.get(template_type, "{content}")
        
        return template.format(greeting=content, result=content, error=content, content=content)
    
    def format_code(self, code: str, language: str = "") -> str:
        """格式化代码"""
        lang = language or "text"
        return f"```{lang}\n{code}\n```"
    
    def format_list(self, items: List[str], numbered: bool = False) -> str:
        """格式化列表"""
        if numbered:
            return '\n'.join(f"{i+1}. {item}" for i, item in enumerate(items))
        return '\n'.join(f"• {item}" for item in items)
    
    def format_table(self, headers: List[str], rows: List[List[str]]) -> str:
        """格式化表格"""
        # 简单文本表格
        col_widths = [len(h) for h in headers]
        for row in rows:
            for i, cell in enumerate(row):
                col_widths[i] = max(col_widths[i], len(str(cell)))
        
        # 表头
        line = "| " + " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers)) + " |"
        separator = "|-" + "-|-".join("-" * w for w in col_widths) + "-|"
        
        # 数据行
        data_lines = []
        for row in rows:
            data_line = "| " + " | ".join(str(cell).ljust(col_widths[i]) for i, cell in enumerate(row)) + " |"
            data_lines.append(data_line)
        
        return '\n'.join([line, separator] + data_lines)


class ActionExecutor:
    """行动执行器"""
    
    def __init__(self):
        self.executors = {}
        self._register_default_executors()
    
    def _register_default_executors(self):
        """注册默认执行器"""
        # 文件操作
        self.executors["file.write"] = self._write_file
        self.executors["file.read"] = self._read_file
        self.executors["file.delete"] = self._delete_file
        
        # 命令执行
        self.executors["shell.run"] = self._run_shell
        
        # HTTP 请求
        self.executors["http.request"] = self._http_request
        
        # 搜索
        self.executors["search.web"] = self._search_web
    
    def _write_file(self, params: Dict) -> Dict:
        """写文件"""
        path = params.get("path")
        content = params.get("content", "")
        
        if not path:
            return {"success": False, "error": "缺少路径"}
        
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return {"success": True, "path": path}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _read_file(self, params: Dict) -> Dict:
        """读文件"""
        path = params.get("path")
        
        if not path:
            return {"success": False, "error": "缺少路径"}
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {"success": True, "content": content}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _delete_file(self, params: Dict) -> Dict:
        """删文件"""
        path = params.get("path")
        
        if not path:
            return {"success": False, "error": "缺少路径"}
        
        try:
            os.remove(path)
            return {"success": True, "path": path}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _run_shell(self, params: Dict) -> Dict:
        """运行shell命令"""
        command = params.get("command")
        
        if not command:
            return {"success": False, "error": "缺少命令"}
        
        # 注意：这里应该调用实际的 shell 执行
        return {"success": False, "error": "Shell执行需要在安全沙箱中进行"}
    
    def _http_request(self, params: Dict) -> Dict:
        """HTTP请求"""
        return {"success": False, "error": "HTTP请求需要配置"}
    
    def _search_web(self, params: Dict) -> Dict:
        """网页搜索"""
        return {"success": False, "error": "搜索需要配置"}
    
    def execute(self, action: str, params: Dict) -> Dict:
        """执行行动"""
        executor = self.executors.get(action)
        
        if not executor:
            return {"success": False, "error": f"未知行动: {action}"}
        
        return executor(params)


class FeedbackCollector:
    """反馈收集器"""
    
    def __init__(self):
        self.feedback_history = []
    
    def collect(self, feedback_type: str, content: str, context: Dict = None):
        """收集反馈"""
        entry = {
            "type": feedback_type,
            "content": content,
            "context": context or {},
            "timestamp": datetime.now().isoformat(),
        }
        self.feedback_history.append(entry)
        
        # 保存到文件
        self._save_feedback(entry)
        
        return entry
    
    def _save_feedback(self, entry: Dict):
        """保存反馈"""
        feedback_dir = os.path.expanduser("~/.openclaw/workspace/memory")
        feedback_file = os.path.join(feedback_dir, "feedback.jsonl")
        
        os.makedirs(feedback_dir, exist_ok=True)
        
        with open(feedback_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    
    def ask_confirmation(self, question: str) -> str:
        """生成确认问题"""
        return f"{question}\n\n请回复「是」或「否」"
    
    def ask_clarification(self, question: str, options: List[str] = None) -> str:
        """生成澄清问题"""
        if options:
            options_text = " | ".join(options)
            return f"{question}\n\n选项: {options_text}"
        return question
    
    def generate_clarification_prompt(self, missing_info: List[str]) -> str:
        """生成信息缺失提示"""
        if not missing_info:
            return ""
        
        items = self.format_list(missing_info)
        return f"请补充以下信息:\n{items}"


class OutputSystem:
    """输出系统主控制器"""
    
    def __init__(self):
        self.generator = ResponseGenerator()
        self.executor = ActionExecutor()
        self.feedback = FeedbackCollector()
        
        self.default_style = OutputStyle.FRIENDLY
        self.default_format = OutputFormat.TEXT
    
    def generate_response(self, 
                         content: str, 
                         style: OutputStyle = None,
                         format: OutputFormat = None,
                         template_type: str = "result") -> OutputContent:
        """生成回复"""
        style = style or self.default_style
        format = format or self.default_format
        
        # 格式化内容
        if format == OutputFormat.CODE:
            content = self.generator.format_code(content)
        
        # 应用风格模板
        formatted = self.generator.generate(content, style, template_type)
        
        return OutputContent(
            format=format,
            style=style,
            content=formatted,
            metadata={
                "style": style.value,
                "format": format.value,
                "timestamp": datetime.now().isoformat(),
            }
        )
    
    def execute_action(self, action: str, params: Dict) -> Dict:
        """执行行动"""
        return self.executor.execute(action, params)
    
    def format_result(self, result: Any, format: OutputFormat = None) -> str:
        """格式化结果"""
        format = format or self.default_format
        
        if format == OutputFormat.JSON:
            if isinstance(result, dict):
                return json.dumps(result, ensure_ascii=False, indent=2)
            return str(result)
        
        if isinstance(result, dict):
            lines = [f"**{k}**: {v}" for k, v in result.items()]
            return '\n'.join(lines)
        
        if isinstance(result, list):
            return self.generator.format_list([str(i) for i in result])
        
        return str(result)
    
    def create_feedback_prompt(self, intent: Dict, context: Dict) -> str:
        """创建反馈提示"""
        action = intent.get("action", "")
        
        # 需要确认的操作
        confirm_actions = ["delete", "execute", "write"]
        
        if action in confirm_actions:
            return self.feedback.ask_confirmation(f"确定要{action}吗？")
        
        # 需要澄清的操作
        clarify_actions = ["create", "search"]
        
        if action in clarify_actions:
            return self.feedback.ask_clarification("请告诉我更多细节")
        
        return ""
    
    def get_status(self) -> Dict:
        """获取状态"""
        return {
            "default_style": self.default_style.value,
            "default_format": self.default_format.value,
            "available_actions": list(self.executor.executors.keys()),
        }
