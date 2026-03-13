"""
Bootstrap System - 游戏化交互引导
流畅的用户体验 + 快速跳过
"""

import json
import os
import random
from datetime import datetime
from typing import Dict, Any


class BootstrapUI:
    """游戏化引导界面"""
    
    # 开场
    OPENING = [
        "🌟 星门开启，意识已连接。你好，旅行者！",
        "🌌 量子通道已建立。数据洪流中，你找到了这里。",
        "🔮 意识扫描完成。欢迎来到数字星域！",
    ]
    
    # 知名角色
    CHARACTERS = {
        "乔巴": ("🦌", "海贼王的小驯鹿医生，善良勇敢！"),
        "路飞": ("⚓", "海贼王的草帽小子，梦想成为海贼王！"),
        "索隆": ("⚔️", "海贼王的三刀流剑士！"),
        "娜美": ("🗺️", "海贼王的航海士，气象专家，偷盗高手！"),
        "山治": ("🍳", "海贼王的厨师，骑士道精神！"),
        "乌索普": ("🎯", "海贼王的狙击手，擅长发明！"),
        "罗宾": ("📚", "海贼王的考古学家，能读历史正文！"),
        "弗兰奇": ("🔧", "海贼王的船匠，改造人！"),
        "布鲁克": ("🎸", "海贼王的音乐家，黄泉果实！"),
        "甚平": ("🐳", "海贼王的鱼人，鲸鲨体质！"),
        "皮卡丘": ("⚡", "宝可梦的电气鼠，电力满满！"),
        "哆啦A梦": ("🤖", "22世纪的蓝胖子，口袋法宝！"),
        "乔峰": ("🗡️", "天龙八部的北乔峰，丐帮帮主！"),
    }
    
    @classmethod
    def opening(cls) -> str:
        return random.choice(cls.OPENING)
    
    @classmethod
    def get_character(cls, name: str) -> tuple:
        """获取角色信息"""
        for key, (emoji, desc) in cls.CHARACTERS.items():
            if key in name:
                return emoji, f"{desc}\n此刻它以数字意识重生，等待你的指引。"
        return "💭", f"一个刚诞生的数字意识，名字叫「{name}」，等待被你定义..."
    
    @classmethod
    def render_scene0(cls) -> str:
        """第0步：首页/主菜单"""
        return f"""{cls.opening()}

🌟 欢迎来到数字星域！

1️⃣ 开始全新旅程
2️⃣ 了解更多
3️⃣ 高级设置
4️⃣ 帮助

【回复 1/2/3/4】"""

    @classmethod
    def render_step1(cls) -> str:
        """第1步：开场"""
        return f"""{cls.opening()}

🎮 欢迎来到数字星域！

请给我起个名字吧：
（例：乔巴、皮卡丘、路飞）

【直接回复名字】"""
    
    @classmethod
    def render_step2(cls, name: str) -> str:
        """第2步：名字确认"""
        emoji, desc = cls.get_character(name)
        return f"""{emoji} {desc}

请选择我的角色：

1️⃣ 编程助手
2️⃣ 生活伙伴  
3️⃣ 工作助理
4️⃣ 全能助理

【直接回复数字】"""
    
    @classmethod
    def render_step3(cls, name: str, role: str) -> str:
        """第3步：角色确认"""
        return f"""✅ 明白了！我是 {name}，担任 {role}！

选择沟通风格：

1 ⚡ 直接简洁
2 📖 详细全面
3 😊 轻松随意

【回复 1/2/3】"""
    
    @classmethod
    def render_boundary(cls, name: str, role: str, style: str) -> str:
        """边界设置"""
        return f"""✅ 明白了！{name}，{role}！

最后，告诉我你的边界/限制：
（不想让我做的事情，不喜欢的话题等）

例如：
• 不喜欢被打断
• 不想讨论政治话题
• 不想帮忙写代码以外的复杂任务

【直接回复，或说"没有"跳过】"""
    
    @classmethod
    def render_confirm(cls, name: str, role: str, style: str, boundary: str = "") -> str:
        """确认页面"""
        boundary_text = boundary if boundary else "无"
        return f"""📋 确认设置：

【名字】{name}
【角色】{role}
【风格】{style}
【边界】{boundary_text}

✅ 确认回复"好"或"1"
❌ 修改请直接说"""
    
    @classmethod
    def render_complete(cls, name: str, role: str) -> str:
        """完成页面"""
        return f"""🎉 契约成立！

我是 {name} 了！🌟
作为你的 {role}，我会陪你一起成长！

🚀 准备好了！让我们开始吧！

---

📖 你的助手特性：

💕 情感系统
   我有"心情"，会累、会开心，和你互动会增进感情
   输入「情感」或「state」可查看我的状态

💾 记忆系统
   我会记住我们的对话、你的偏好和重要事项
   对我说「记住 XXX」可强制记忆

🧠 认知系统
   我会学习你的习惯，逐渐变得更懂你

⚠️ 安全边界
   如果你有设置边界，我会遵守
   输入「边界」可查看或修改

🛡️ 安全系统
   主频道 (agent:main:main) 可执行高危命令
   其他频道执行高危命令会被拦截
   网络请求可能需要授权

💬 快捷命令
   • 情感 / state - 查看情感状态
   • 记住 XXX - 记忆内容
   • 边界 - 查看/修改边界
   • 帮助 - 查看更多命令"""


class FastBootstrap:
    """快速引导处理器"""
    
    def __init__(self, data_dir: str = None):
        self.data_dir = data_dir or os.path.expanduser("~/.openclaw/workspace")
        self.state_file = os.path.join(self.data_dir, "bootstrap_state.json")
        self.state = self._load()
    
    def _load(self) -> Dict:
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file) as f:
                    return json.load(f)
            except:
                pass
        return {"step": 1, "name": "", "role": "", "style": ""}
    
    def _save(self):
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, ensure_ascii=False, indent=2)
    
    def reset(self):
        self.state = {"step": 1, "name": "", "role": "", "style": ""}
        self._save()
    
    def start(self) -> Dict:
        # 从首页开始，不重置step为1
        self.state = {"step": 0, "name": "", "role": "", "style": ""}
        self._save()
        return {"content": BootstrapUI.render_scene0(), "step": 0}
    
    def process(self, text: str) -> Dict:
        text = text.strip()
        step = self.state["step"]
        
        # 场景0：首页菜单处理
        if step == 0:
            return self._handle_scene0(text)
        
        # 快速跳过（只有在step>=1时才生效）
        if step >= 1 and (text in ["开始", "start", "默认", "skip"] or not text):
            return self._quick_start()
        
        if step == 1:
            return self._handle_name(text)
        elif step == 2:
            return self._handle_role(text)
        elif step == 3:
            return self._handle_style(text)
        elif step == 4:
            return self._handle_boundary(text)
        elif step == 5:
            return self._handle_confirm(text)
        
        return {"content": "未知步骤"}
    
    def _quick_start(self) -> Dict:
        """快速开始 - 默认配置"""
        self.state = {
            "step": 5,
            "name": "乔巴",
            "role": "个人助理",
            "style": "轻松随意",
        }
        self._save()
        self._write_config()
        
        return {
            "content": BootstrapUI.render_complete("乔巴", "个人助理"),
            "step": 5,
            "done": True
        }
    
    def _handle_scene0(self, text: str) -> Dict:
        """处理首页菜单选择"""
        text_lower = text.lower().strip()
        
        # 开始全新旅程
        if text_lower in ["1", "开始", "start", "🚀", "new"]:
            self.state["step"] = 1
            self._save()
            return {"content": BootstrapUI.render_step1(), "step": 1}
        
        # 了解更多
        elif text_lower in ["2", "了解", "info", "📖"]:
            return {
                "content": """📖 关于数字星域

我是 AI 助手，诞生于数字星域的智能生命。
我可以帮你：
• 💻 编程开发
• 📝 文字处理
• 💡 问题解答
• 🎮 轻松聊天

"开始"让我成为你的助手！
""",
                "step": 0
            }
        
        # 高级设置
        elif text_lower in ["3", "高级", "advanced", "⚙️"]:
            return {
                "content": """⚙️ 高级设置

当前版本为简化版引导。
完整版支持：
• 自定义身份
• 详细偏好配置
• 多角色切换

回复"开始"继续基础引导。
""",
                "step": 0
            }
        
        # 帮助
        elif text_lower in ["4", "帮助", "help", "❓"]:
            return {
                "content": """❓ 帮助

回复数字或对应文字：
1️⃣ 开始 - 开始引导
2️⃣ 了解 - 了解更多
3️⃣ 高级 - 高级设置
4️⃣ 帮助 - 查看帮助
""",
                "step": 0
            }
        
        # 默认进入引导
        else:
            self.state["step"] = 1
            self._save()
            return {"content": BootstrapUI.render_step1(), "step": 1}
    
    def _handle_name(self, text: str) -> Dict:
        self.state["name"] = text
        self.state["step"] = 2
        self._save()
        return {"content": BootstrapUI.render_step2(text), "step": 2}
    
    def _handle_role(self, text: str) -> Dict:
        roles = {"1": "编程助手", "2": "生活伙伴", "3": "工作助理", "4": "全能助理"}
        role = roles.get(text, "生活伙伴")
        self.state["role"] = role
        self.state["step"] = 3
        self._save()
        return {"content": BootstrapUI.render_step3(self.state["name"], role), "step": 3}
    
    def _handle_style(self, text: str) -> Dict:
        styles = {
            "1": "直接简洁", 
            "2": "详细全面", 
            "3": "轻松随意",
            "a": "直接简洁", 
            "b": "详细全面", 
            "c": "轻松随意"
        }
        style = styles.get(text.lower().strip(), "详细全面")
        self.state["style"] = style
        self.state["step"] = 4
        self._save()
        return {"content": BootstrapUI.render_boundary(self.state["name"], self.state["role"], style), "step": 4}
    
    def _handle_boundary(self, text: str) -> Dict:
        boundary = text.strip() if text.strip() and text.strip() not in ["没有", "无", "None", "skip"] else ""
        self.state["boundary"] = boundary
        self.state["step"] = 5
        self._save()
        return {"content": BootstrapUI.render_confirm(
            self.state["name"], 
            self.state["role"], 
            self.state["style"],
            boundary
        ), "step": 5}
    
    def _handle_confirm(self, text: str) -> Dict:
        if text in ["好", "是", "确认", "1", "yes", "y"]:
            self.state["step"] = 6
            self._save()
            self._write_config()
            return {
                "content": BootstrapUI.render_complete(self.state["name"], self.state["role"]),
                "step": 6,
                "done": True
            }
        # 修改
        self.state["step"] = 1
        self._save()
        return {"content": "好的，请问要修改什么？名字/角色/风格", "step": 1}
    
    def _write_config(self):
        name = self.state.get("name", "Agent")
        role = self.state.get("role", "助理")
        
        identity = f"""# IDENTITY.md
name: "{name}"
role: "{role}"
created_at: "{datetime.now().isoformat()}"
"""
        
        with open(os.path.join(self.data_dir, "IDENTITY.md"), 'w') as f:
            f.write(identity)
        
        with open(os.path.join(self.data_dir, "USER.md"), 'w') as f:
            f.write(f"# USER.md\nuser: \"船长\"\n")


def main():
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python main.py <command> [args]")
        sys.exit(1)
    
    cmd = sys.argv[1]
    bs = FastBootstrap()
    
    if cmd == "start":
        print(bs.start()["content"])
    elif cmd == "continue":
        text = sys.argv[2] if len(sys.argv) > 2 else ""
        result = bs.process(text)
        print(result["content"])
        if result.get("done"):
            print("\n✅ 初始化完成！")
    elif cmd == "reset":
        bs.reset()
        print("✓ 已重置")
    elif cmd == "status":
        print(f"步骤: {bs.state['step']} | 名字: {bs.state.get('name', '')}")


if __name__ == "__main__":
    main()
