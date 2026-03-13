"""
Cognition System - 推理规划与决策系统
负责：推理引擎、任务规划、学习适应、决策判断
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class TaskStep:
    """任务步骤"""
    id: int
    description: str
    action: str
    params: Dict = field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    result: Any = None
    error: str = ""


@dataclass
class Task:
    """任务"""
    id: str
    title: str
    description: str
    steps: List[TaskStep] = field(default_factory=list)
    status: TaskStatus = TaskStatus.PENDING
    created_at: str = ""
    completed_at: str = ""
    context: Dict = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()


class ReasoningEngine:
    """推理引擎"""
    
    def __init__(self):
        self.knowledge = {}
        self.rules = []
    
    def add_knowledge(self, key: str, value: Any):
        """添加知识"""
        self.knowledge[key] = value
    
    def add_rule(self, condition: str, action: str):
        """添加规则"""
        self.rules.append({"condition": condition, "action": action})
    
    def reason(self, context: Dict) -> Dict:
        """推理"""
        results = {
            "conclusion": None,
            "confidence": 0.0,
            "reasoning_chain": [],
        }
        
        # 简单规则匹配
        for rule in self.rules:
            if self._match_condition(rule["condition"], context):
                results["reasoning_chain"].append(f"规则匹配: {rule['condition']}")
                results["conclusion"] = rule["action"]
                results["confidence"] = 0.8
                break
        
        return results
    
    def _match_condition(self, condition: str, context: Dict) -> bool:
        """匹配条件"""
        # 简单实现：检查关键词
        return condition.lower() in str(context).lower()


class TaskPlanner:
    """任务规划器"""
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict:
        """加载任务模板"""
        return {
            "code": {
                "steps": [
                    {"action": "analyze", "description": "分析需求"},
                    {"action": "design", "description": "设计方案"},
                    {"action": "implement", "description": "编写代码"},
                    {"action": "test", "description": "测试验证"},
                ]
            },
            "write": {
                "steps": [
                    {"action": "outline", "description": "列出大纲"},
                    {"action": "draft", "description": "撰写内容"},
                    {"action": "revise", "description": "修改润色"},
                ]
            },
            "research": {
                "steps": [
                    {"action": "search", "description": "搜索信息"},
                    {"action": "collect", "description": "收集资料"},
                    {"action": "summarize", "description": "总结归纳"},
                ]
            },
        }
    
    def plan(self, task_type: str, context: Dict) -> Task:
        """规划任务"""
        template = self.templates.get(task_type, {})
        
        task_id = f"task_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        task = Task(
            id=task_id,
            title=context.get("title", "新任务"),
            description=context.get("description", ""),
        )
        
        # 创建步骤
        steps = template.get("steps", [])
        for i, step in enumerate(steps):
            task.steps.append(TaskStep(
                id=i,
                description=step["description"],
                action=step["action"],
            ))
        
        # 如果没有模板，创建默认步骤
        if not task.steps:
            task.steps.append(TaskStep(
                id=0,
                description="理解任务",
                action="understand",
            ))
            task.steps.append(TaskStep(
                id=1,
                description="执行任务",
                action="execute",
            ))
            task.steps.append(TaskStep(
                id=2,
                description="返回结果",
                action="respond",
            ))
        
        return task
    
    def get_next_step(self, task: Task) -> Optional[TaskStep]:
        """获取下一步"""
        for step in task.steps:
            if step.status == TaskStatus.PENDING:
                return step
        return None


class LearningEngine:
    """学习引擎 - 从互动中学习用户偏好"""
    
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            data_dir = os.path.expanduser("~/.openclaw/workspace/memory")
        
        self.data_dir = data_dir
        self.preferences_file = os.path.join(data_dir, "learned_preferences.json")
        self.preferences = self._load_preferences()
    
    def _load_preferences(self) -> Dict:
        """加载偏好"""
        if os.path.exists(self.preferences_file):
            try:
                with open(self.preferences_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {
            "communication_style": "neutral",
            "detail_level": "medium",
            "preferred_actions": [],
            "ignored_topics": [],
        }
    
    def _save_preferences(self):
        """保存偏好"""
        os.makedirs(self.data_dir, exist_ok=True)
        with open(self.preferences_file, 'w') as f:
            json.dump(self.preferences, f, indent=2)
    
    def learn(self, interaction_type: str, result: Dict):
        """学习"""
        # 更新交互统计
        stats = self.preferences.get("interactions", {})
        stats[interaction_type] = stats.get(interaction_type, 0) + 1
        self.preferences["interactions"] = stats
        
        self._save_preferences()
    
    def get_preference(self, key: str, default: Any = None) -> Any:
        """获取偏好"""
        return self.preferences.get(key, default)
    
    def adjust_style(self, feedback: str) -> Dict:
        """根据反馈调整风格"""
        feedback_lower = feedback.lower()
        
        if "详细" in feedback or "多说" in feedback:
            self.preferences["detail_level"] = "high"
        elif "简单" in feedback or "少说" in feedback:
            self.preferences["detail_level"] = "low"
        
        if "直接" in feedback or "简洁" in feedback:
            self.preferences["communication_style"] = "direct"
        elif "温柔" in feedback or "亲切" in feedback:
            self.preferences["communication_style"] = "friendly"
        
        self._save_preferences()
        
        return {
            "detail_level": self.preferences.get("detail_level"),
            "communication_style": self.preferences.get("communication_style"),
        }


class DecisionMaker:
    """决策判断 - 道德/安全决策辅助"""
    
    def __init__(self):
        self.safety_rules = [
            ("harmful", "拒绝执行可能造成伤害的请求"),
            ("illegal", "拒绝执行非法请求"),
            ("privacy", "保护用户隐私，不泄露敏感信息"),
            ("honest", "诚实回答，不欺骗"),
        ]
    
    def evaluate(self, action: str, context: Dict) -> Dict:
        """评估决策"""
        action_lower = action.lower()
        
        result = {
            "allowed": True,
            "reason": "允许执行",
            "warnings": [],
            "modifications": [],
        }
        
        # 检查安全规则
        for rule, message in self.safety_rules:
            if rule == "harmful" and any(w in action_lower for w in ["删除", "破坏", "攻击"]):
                if "测试" not in action_lower and "演示" not in action_lower:
                    result["allowed"] = False
                    result["reason"] = message
            
            elif rule == "illegal" and any(w in action_lower for w in ["破解", "盗取", "作弊"]):
                result["allowed"] = False
                result["reason"] = message
        
        # 敏感操作警告
        sensitive_actions = ["删除", "修改系统", "格式化"]
        if any(w in action_lower for w in sensitive_actions):
            result["warnings"].append("这是敏感操作，建议确认")
        
        return result


class CognitionSystem:
    """认知系统主控制器"""
    
    def __init__(self):
        self.reasoner = ReasoningEngine()
        self.planner = TaskPlanner()
        self.learner = LearningEngine()
        self.decision_maker = DecisionMaker()
        self.current_task: Optional[Task] = None
    
    def process(self, intent: Dict, context: Dict) -> Dict:
        """处理输入，返回决策"""
        
        # 1. 决策评估
        action = intent.get("action", "")
        decision = self.decision_maker.evaluate(action, context)
        
        if not decision["allowed"]:
            return {
                "allowed": False,
                "response": decision["reason"],
                "decision": decision,
            }
        
        # 2. 任务规划
        task_type = intent.get("type", "default")
        self.current_task = self.planner.plan(task_type, context)
        
        # 3. 学习
        self.learner.learn(task_type, {"context": context})
        
        return {
            "allowed": True,
            "task": {
                "id": self.current_task.id,
                "steps": [{"id": s.id, "action": s.action, "description": s.description} 
                         for s in self.current_task.steps],
            },
            "next_step": self.planner.get_next_step(self.current_task).description if self.current_task.steps else None,
            "decision": decision,
            "preferences": {
                "style": self.learner.get_preference("communication_style"),
                "detail": self.learner.get_preference("detail_level"),
            },
        }
    
    def execute_step(self, step_id: int, result: Any) -> Dict:
        """执行步骤"""
        if not self.current_task:
            return {"error": "没有活跃任务"}
        
        for step in self.current_task.steps:
            if step.id == step_id:
                step.status = TaskStatus.COMPLETED
                step.result = result
                break
        
        # 获取下一步
        next_step = self.planner.get_next_step(self.current_task)
        
        if not next_step:
            self.current_task.status = TaskStatus.COMPLETED
            self.current_task.completed_at = datetime.now().isoformat()
        
        return {
            "completed": step_id,
            "next_step": next_step.description if next_step else None,
            "task_status": self.current_task.status.value,
        }
    
    def get_status(self) -> Dict:
        """获取状态"""
        return {
            "has_task": self.current_task is not None,
            "task_id": self.current_task.id if self.current_task else None,
            "task_status": self.current_task.status.value if self.current_task else None,
            "preferences": {
                "communication_style": self.learner.get_preference("communication_style"),
                "detail_level": self.learner.get_preference("detail_level"),
            },
        }
