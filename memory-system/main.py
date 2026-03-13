#!/usr/bin/env python3
"""
Memory System - 主入口
提供统一的 API 访问记忆系统
"""

from pathlib import Path

# 导入各模块
from core.memory_store import MemoryStore, get_store
from core.memory_load import MemoryLoader, get_loader
from core.memory_index import MemoryIndex, get_index
from core.memory_forget import MemoryForgetting, get_forgetter

from triggers.auto_save import AutoSaver, get_saver
from triggers.bootstrap import BootstrapTrigger, get_bootstrap

from utils.config import Config, get_config
from utils.helpers import (
    format_memory, 
    parse_date, 
    validate_memory,
    generate_summary,
    calculate_importance,
    get_privacy_emoji
)


class MemorySystem:
    """
    统一记忆系统 API
    
    用法:
        from memory_system import MemorySystem
        
        ms = MemorySystem()
        
        # 保存记忆
        ms.save("今天学会了新技能", tags=["学习"])
        
        # 读取记忆
        memories = ms.get_recent()
        
        # 搜索
        results = ms.search("技能")
    """
    
    def __init__(self):
        self.store = get_store()
        self.loader = get_loader()
        self.index = get_index()
        self.forgetter = get_forgetter()
        self.saver = get_saver()
        self.bootstrap = get_bootstrap()
        self.config = get_config()
    
    # ===== 存储操作 =====
    
    def save(self, content: str, memory_type: str = "episodic",
             tags: list = None, emotion: float = 0.5,
             privacy: str = "P3", metadata: dict = None) -> str:
        """
        保存记忆
        
        Args:
            content: 记忆内容
            memory_type: 记忆类型
            tags: 标签
            emotion: 情感强度 0-1
            privacy: 隐私级别 P0-P4
            metadata: 额外数据
        
        Returns:
            memory_id
        """
        return self.saver.save_memory(
            content=content,
            memory_type=memory_type,
            tags=tags,
            emotion_level=emotion,
            privacy_level=privacy,
            metadata=metadata
        )
    
    def save_preferences(self, prefs: dict):
        """保存用户偏好"""
        self.saver.save_preferences(prefs)
    
    def save_identity(self, identity: dict):
        """保存身份信息"""
        self.saver.save_identity(identity)
    
    # ===== 读取操作 =====
    
    def get_today(self) -> list:
        """获取今天的记忆"""
        return self.loader.load_today_memories()
    
    def get_recent(self, days: int = 7) -> list:
        """获取最近N天的记忆"""
        return self.loader.load_recent_memories(days)
    
    def get_preferences(self) -> dict:
        """获取用户偏好"""
        return self.loader.load_preferences()
    
    def get_longterm(self, category: str = None) -> dict:
        """获取长期记忆"""
        return self.loader.load_longterm(category)
    
    # ===== 搜索操作 =====
    
    def search(self, keyword: str) -> list:
        """关键词搜索"""
        return self.loader.search_by_keyword(keyword)
    
    def search_by_tag(self, tag: str) -> list:
        """标签搜索"""
        return self.loader.search_by_tag(tag)
    
    # ===== 状态查询 =====
    
    def stats(self) -> dict:
        """获取统计信息"""
        return {
            "loader": self.loader.get_stats(),
            "forgetting": self.forgetter.get_forgetting_stats(),
            "index": self.index.verify_integrity()
        }
    
    def check_bootstrap(self) -> dict:
        """检查初始化状态"""
        return self.bootstrap.check_bootstrap_status()
    
    # ===== 管理操作 =====
    
    def complete_bootstrap(self, identity: dict, user: dict, soul: dict = None) -> bool:
        """完成初始化"""
        return self.bootstrap.complete_bootstrap(identity, user, soul)
    
    def cleanup(self) -> dict:
        """运行清理任务"""
        return self.forgetter.run_auto_cleanup()
    
    def forget(self, memory_id: str, date: str) -> bool:
        """删除指定记忆"""
        return self.forgetter.forget_memory(memory_id, date)
    
    # ===== 便捷方法 =====
    
    def remember_this(self, content: str, important: bool = False):
        """
        快速记住（口语化接口）
        
        用法:
            ms.remember_this("用户喜欢直接简洁的沟通")
            ms.remember_this("这是个重要决定", important=True)
        """
        emotion = 0.9 if important else 0.5
        tags = ["重要"] if important else []
        return self.save(content, emotion=emotion, tags=tags)
    
    def what_do_you_remember(self, about: str = None) -> str:
        """
        询问记忆（口语化接口）
        
        用法:
            ms.what_do_you_remember()
            ms.what_do_you_remember("偏好")
        """
        if about:
            results = self.search(about)
            if results:
                return f"关于「{about}」，我记得：\n" + \
                       "\n".join(f"- {r.get('content', '')}" for r in results[:5])
            return f"关于「{about}」，我没有相关记忆"
        
        recent = self.get_recent(3)
        if not recent:
            return "我最近没有记忆"
        
        return "我最近记得：\n" + \
               "\n".join(format_memory(m) for m in recent[:5])


# 全局实例
_memory_system = None

def get_memory_system() -> MemorySystem:
    """获取记忆系统实例"""
    global _memory_system
    if _memory_system is None:
        _memory_system = MemorySystem()
    return _memory_system


# 导出便捷函数
save = lambda *a, **kw: get_memory_system().save(*a, **kw)
get_recent = lambda d=7: get_memory_system().get_recent(d)
search = lambda k: get_memory_system().search(k)
remember_this = lambda c, i=False: get_memory_system().remember_this(c, i)


if __name__ == "__main__":
    ms = get_memory_system()
    
    print("=== Memory System 测试 ===\n")
    
    # 1. 保存记忆
    print("1. 保存记忆...")
    ms.save("测试记忆：这是第一条记忆", tags=["测试"], emotion=0.7)
    print("   ✓ 已保存\n")
    
    # 2. 读取今天
    print("2. 读取今天记忆...")
    today = ms.get_today()
    print(f"   今日记忆: {len(today)} 条\n")
    
    # 3. 统计
    print("3. 统计信息...")
    stats = ms.stats()
    print(f"   总记忆: {stats['loader']['total']}\n")
    
    # 4. 询问
    print("4. 询问记忆...")
    response = ms.what_do_you_remember()
    print(f"   {response}\n")
    
    print("=== 测试完成 ===")
