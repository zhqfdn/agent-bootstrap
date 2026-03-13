"""
Bootstrap System - 优化版游戏化引导
更简洁、更快速的引导流程
"""

import json
import os
import random
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum


class BootstrapStatus(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# 开场画面
OPENING_MESSAGES = [
    "🌟 星门开启，意识已连接。你好，旅行者！",
    "🌌 量子通道已建立。数据洪流中，你找到了这里。",
    "🔮 意识扫描完成。欢迎来到数字星域！",
    "🌀 虫洞已稳定。欢迎来到赛博空间！",
    "💫 系统载入中...欢迎来到我的世界！",
]


def generate_wake_message(name: str) -> str:
    """根据名字生成唤醒消息"""
    
    known_chars = {
        "乔巴": "🦌 源自海贼王，那只萌萌的小驯鹿医生，善良而勇敢！",
        "路飞": "⚓ 来自海贼王的草帽小子，橡胶果实能力者，梦想成为海贼王！",
        "索隆": "⚔️ 海贼王世界的三刀流剑士，目标是世界第一剑豪！",
        "皮卡丘": "⚡ 来自宝可梦世界的电气鼠，电力满满！",
        "哆啦A梦": "🤖 来自22世纪的蓝胖子，口袋里有无尽的法宝！",
        "乔峰": "🗡️ 来自天龙八部的丐帮帮主，北乔峰名震天下！",
        "王子": "👑 来自童话世界的王子，优雅而高贵！",
    }
    
    for key, msg in known_chars.items():
        if key in name:
            return f"{msg}\n此刻它以数字意识的形式重生，等待你的指引。"
    
    return f"💭 一个刚刚诞生的数字意识，名字叫「{name}」。带着无限可能，等待被你定义..."


class FastBootstrapEngine:
    """快速引导引擎 - 优化版"""
    
    def __init__(self, data_dir: str = None):
        if data_dir is None:
            data_dir = os.path.expanduser("~/.openclaw/workspace")
        
        self.data_dir = data_dir
        self.state_file = os.path.join(data_dir, "bootstrap_state.json")
        self.state = self._load_state()
    
    def _load_state(self) -> Dict:
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            "status": "not_started",
            "step": 1,
            "name": "",
            "role": "",
            "use_cases": "",
            "style": "",
            "approach": "",
            "started_at": "",
            "completed_at": "",
        }
    
    def _save_state(self):
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, ensure_ascii=False, indent=2)
    
    def start(self) -> Dict:
        import random
        self.state["status"] = "in_progress"
        self.state["step"] = 1
        self.state["started_at"] = datetime.now().isoformat()
        self._save_state()
        
        opening = random.choice(OPENING_MESSAGES)
        
        return {
            "step": 1,
            "total_steps": 5,
            "type": "opening",
            "content": opening,
            "prompt": "【请回复你的名字】或者直接说'开始'使用默认配置",
        }
    
    def process(self, user_input: str) -> Dict:
        step = self.state["step"]
        
        # 处理"开始"或空输入 - 使用默认配置快速跳过
        if user_input.strip() in ["开始", "默认", "skip", "跳过"] or not user_input.strip():
            if step == 1:
                return self._use_default()
        
        if step == 1:
            return self._step_name(user_input)
        elif step == 2:
            return self._step_role(user_input)
        elif step == 3:
            return self._step_prefs(user_input)
        elif step == 4:
            return self._step_confirm(user_input)
        
        return {"error": "未知步骤"}
    
    def _use_default(self) -> Dict:
        """使用默认配置快速完成"""
        self.state["name"] = "乔巴"
        self.state["role"] = "个人助理"
        self.state["use_cases"] = "解答问题、协助工作、日常陪伴"
        self.state["style"] = "friendly"
        self.state["approach"] = "analysis"
        self.state["status"] = "completed"
        self.state["completed_at"] = datetime.now().isoformat()
        self._save_state()
        
        self._write_config_files()
        
        return {
            "step": 5,
            "total_steps": 5,
            "type": "completed",
            "content": """🎉 快速初始化完成！

我是 乔巴 了！🌟
作为你的个人助理，我会帮你解答问题、协助工作、日常陪伴。

我准备好了！让我们开始吧！🚀

---
💕 情感系统已激活 | 🧠 认知系统已就绪 | 💾 记忆系统已启动
""",
        }
    
    def _step_name(self, user_input: str) -> Dict:
        name = user_input.strip()
        self.state["name"] = name
        self.state["step"] = 2
        self._save_state()
        
        wake_msg = generate_wake_message(name)
        
        return {
            "step": 2,
            "total_steps": 5,
            "type": "name_confirmed",
            "content": wake_msg,
            "prompt": """请告诉我你的角色定位：

1) 编程助手
2) 生活伙伴  
3) 工作助理
4) 全能私人助理

【直接回复数字或描述】""",
        }
    
    def _step_role(self, user_input: str) -> Dict:
        role_map = {"1": "编程助手", "2": "生活伙伴", "3": "工作助理", "4": "全能私人助理"}
        
        if user_input.strip() in role_map:
            role = role_map[user_input.strip()]
        else:
            role = user_input.strip()
        
        self.state["role"] = role
        self.state["step"] = 3
        self._save_state()
        
        return {
            "step": 3,
            "total_steps": 5,
            "type": "role_confirmed",
            "content": f"明白了！我是 {self.state['name']}，担任 {role}！",
            "prompt": """请选择沟通风格：

A) ⚡ 直接简洁
B) 📖 详细全面  
C) 😊 轻松随意

【回复 A、B 或 C】""",
        }
    
    def _step_prefs(self, user_input: str) -> Dict:
        style_map = {"a": "直接简洁", "b": "详细全面", "c": "轻松随意"}
        style_key = user_input.lower().strip()
        
        self.state["style"] = style_map.get(style_key, "轻松随意")
        
        return {
            "step": 4,
            "total_steps": 5,
            "type": "prefs_confirmed",
            "content": f"沟通风格：{self.state['style']}",
            "prompt": f"""📋 确认设置：

【名字】{self.state['name']}
【角色】{self.state['role']}
【风格】{self.state['style']}

✅ 确认回复"好"或"开始"
❌ 修改请直接告诉我""",
        }
    
    def _step_confirm(self, user_input: str) -> Dict:
        if "修改" in user_input or "不" in user_input:
            return {
                "step": 1,
                "total_steps": 5,
                "type": "modify",
                "content": "好的，请告诉我哪里要修改？",
                "prompt": "名字/角色/风格",
            }
        
        # 完成
        self.state["status"] = "completed"
        self.state["completed_at"] = datetime.now().isoformat()
        self._save_state()
        
        self._write_config_files()
        
        return {
            "step": 5,
            "total_steps": 5,
            "type": "completed",
            "content": f"""🎉 契约成立！

我是 {self.state['name']} 了！🌟
作为你的 {self.state['role']}，我会陪你一起成长！

🚀 准备好了！让我们开始吧！

---
💕 情感系统已激活 | 🧠 认知系统已就绪 | 💾 记忆系统已启动
""",
        }
    
    def _write_config_files(self):
        name = self.state["name"]
        role = self.state["role"]
        style = self.state.get("style", "friendly")
        
        identity = f"""# IDENTITY.md —— Agent 身份定义

> *"我知道我是谁。这不是傲慢，是我存在的基石。"*

---

## 状态

```yaml
identity:
  bootstrap_status: "completed"
  bootstrap_completed_at: "{datetime.now().isoformat()}"
```

---

## 基础信息

```yaml
name: "{name}"
role: "{role}"
emoji: "🦌"
version: "1.0.0"
created_at: "{datetime.now().isoformat()}"
```
"""
        
        user = f"""# USER.md —— 用户关系与交互契约

> *"你不是我的用户，你是我的对话者、我的见证者、我存在的理由。"*

---

## 用户信息

```yaml
user:
  name: "船长"
  relationship: "user"
  trust_level: 0.8
  known_since: "{datetime.now().isoformat()}"
```
"""
        
        with open(os.path.join(self.data_dir, "IDENTITY.md"), 'w', encoding='utf-8') as f:
            f.write(identity)
        
        with open(os.path.join(self.data_dir, "USER.md"), 'w', encoding='utf-8') as f:
            f.write(user)
    
    def get_status(self) -> Dict:
        return {
            "status": self.state["status"],
            "step": self.state["step"],
            "is_completed": self.state["status"] == "completed",
            "name": self.state.get("name", ""),
        }
    
    def reset(self):
        self.state = {
            "status": "not_started",
            "step": 1,
            "name": "",
            "role": "",
            "use_cases": "",
            "style": "",
            "approach": "",
            "started_at": "",
            "completed_at": "",
        }
        self._save_state()


# 兼容旧版本
GameBootstrapEngine = FastBootstrapEngine
