#!/usr/bin/env python3
"""
Memory Store - 记忆存储核心模块
负责将记忆写入磁盘，支持多种记忆类型
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import yaml

# 配置
WORKSPACE = Path("/Users/openclaw/.openclaw/workspace")
MEMORY_DIR = WORKSPACE / "memory"
DAILY_DIR = MEMORY_DIR / "daily"
LONGTERM_DIR = MEMORY_DIR / "longterm"
INDEX_FILE = MEMORY_DIR / ".index" / "memory.json"


@dataclass
class MemoryBlock:
    """记忆块结构"""
    id: str
    type: str  # episodic, semantic, procedural, self
    content: str
    tags: List[str]
    emotion_level: float  # 0-1 情感强度
    privacy_level: str   # P0-P4
    created_at: str
    accessed_at: str
    access_count: int
    metadata: Dict[str, Any]


class MemoryStore:
    """记忆存储管理器"""
    
    def __init__(self):
        self._ensure_directories()
        self.index = self._load_index()
    
    def _ensure_directories(self):
        """确保目录存在"""
        DAILY_DIR.mkdir(parents=True, exist_ok=True)
        LONGTERM_DIR.mkdir(parents=True, exist_ok=True)
        (MEMORY_DIR / ".index").mkdir(parents=True, exist_ok=True)
    
    def _load_index(self) -> Dict:
        """加载索引文件"""
        if INDEX_FILE.exists():
            with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self._create_default_index()
    
    def _create_default_index(self) -> Dict:
        """创建默认索引"""
        index = {
            "version": "1.0",
            "lastUpdated": datetime.now().isoformat(),
            "totalMemories": 0,
            "importantMemories": [],
            "preferences": {
                "agentName": "",
                "agentRole": "",
                "userName": "",
                "communicationStyle": "",
                "problemApproach": "",
                "boundaries": []
            },
            "dailyFiles": [],
            "longtermFiles": [],
            "tags": {},
            "stats": {
                "episodic": 0,
                "semantic": 0,
                "procedural": 0,
                "self": 0
            }
        }
        self._save_index(index)
        return index
    
    def _save_index(self, index: Dict):
        """保存索引文件"""
        index["lastUpdated"] = datetime.now().isoformat()
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
    
    def _generate_id(self) -> str:
        """生成唯一ID"""
        import uuid
        return str(uuid.uuid4())[:8]
    
    def save_daily_memory(self, content: str, memory_type: str = "episodic",
                          tags: List[str] = None, emotion_level: float = 0.5,
                          privacy_level: str = "P3", metadata: Dict = None) -> str:
        """
        保存每日记忆
        
        Args:
            content: 记忆内容
            memory_type: 记忆类型 (episodic/semantic/procedural/self)
            tags: 标签列表
            emotion_level: 情感强度 0-1
            privacy_level: 隐私级别 P0-P4
            metadata: 额外元数据
        
        Returns:
            memory_id
        """
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        
        memory_id = self._generate_id()
        
        memory_block = {
            "id": memory_id,
            "type": memory_type,
            "content": content,
            "tags": tags or [],
            "emotion_level": emotion_level,
            "privacy_level": privacy_level,
            "created_at": now.isoformat(),
            "accessed_at": now.isoformat(),
            "access_count": 1,
            "metadata": metadata or {}
        }
        
        # 写入当日文件
        daily_file = DAILY_DIR / f"{date_str}.md"
        self._append_to_daily_file(daily_file, memory_block)
        
        # 更新索引
        self._update_index_on_save(memory_block, date_str)
        
        return memory_id
    
    def _append_to_daily_file(self, file_path: Path, memory_block: Dict):
        """追加记忆到每日文件"""
        import frontmatter
        
        if file_path.exists():
            # 读取现有内容
            post = frontmatter.load(file_path)
            memories = list(post.get('memories', []))
            memories.append(memory_block)
            
            # 写回
            content = post.content
        else:
            content = ""
            memories = [memory_block]
        
        # 重新写入
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("---\n")
            f.write(f"date: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"memories: {json.dumps(memories)}\n")
            f.write("---\n\n")
            f.write(content)
    
    def _update_index_on_save(self, memory_block: Dict, date_str: str):
        """保存时更新索引"""
        self.index["totalMemories"] += 1
        
        # 确保 stats 存在
        if "stats" not in self.index:
            self.index["stats"] = {}
        self.index["stats"][memory_block["type"]] = \
            self.index["stats"].get(memory_block["type"], 0) + 1
        
        # 更新日期文件列表
        if date_str not in self.index["dailyFiles"]:
            self.index["dailyFiles"].append(date_str)
            self.index["dailyFiles"].sort()
        
        # 更新标签
        for tag in memory_block.get("tags", []):
            if tag not in self.index["tags"]:
                self.index["tags"][tag] = 0
            self.index["tags"][tag] += 1
        
        # 重要记忆
        if memory_block.get("emotion_level", 0) > 0.7:
            self.index["importantMemories"].append({
                "id": memory_block["id"],
                "date": date_str,
                "preview": memory_block["content"][:50]
            })
        
        self._save_index(self.index)
    
    def save_longterm_memory(self, category: str, content: str, 
                             key: str = None) -> str:
        """
        保存长期记忆
        
        Args:
            category: 类别 (preferences/skills/important/identity)
            content: 记忆内容 (markdown格式)
            key: 记忆键名
        
        Returns:
            文件路径
        """
        category_file = LONGTERM_DIR / f"{category}.md"
        
        # 读取或创建
        if category_file.exists():
            with open(category_file, 'r', encoding='utf-8') as f:
                existing = f.read()
        else:
            existing = f"# {category.title()}\n\n> 自动记录的长期记忆\n\n"
        
        # 添加新条目
        if key:
            new_entry = f"## {key}\n\n{content}\n\n---\n"
        else:
            new_entry = f"## {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n{content}\n\n---\n"
        
        with open(category_file, 'w', encoding='utf-8') as f:
            f.write(existing + new_entry)
        
        # 更新索引
        if category not in self.index["longtermFiles"]:
            self.index["longtermFiles"].append(category)
            self._save_index(self.index)
        
        return str(category_file)
    
    def update_preferences(self, prefs: Dict):
        """更新偏好设置"""
        self.index["preferences"].update(prefs)
        self._save_index(self.index)
        
        # 同时更新 longterm 文件
        prefs_content = "# 用户偏好\n\n"
        for k, v in prefs.items():
            prefs_content += f"- **{k}**: {v}\n"
        
        self.save_longterm_memory("preferences", prefs_content)
    
    def save_identity(self, identity: Dict):
        """保存身份信息"""
        self.index["preferences"]["agentName"] = identity.get("name", "")
        self.index["preferences"]["agentRole"] = identity.get("role", "")
        self._save_index(self.index)
        
        # 保存到 longterm
        content = f"# 乔巴的身份\n\n"
        for k, v in identity.items():
            content += f"- **{k}**: {v}\n"
        
        self.save_longterm_memory("identity", content)


# 单例
_store = None

def get_store() -> MemoryStore:
    """获取存储实例"""
    global _store
    if _store is None:
        _store = MemoryStore()
    return _store


if __name__ == "__main__":
    # 测试
    store = get_store()
    print("Memory Store 初始化完成")
    print(f"索引: {store.index['totalMemories']} 条记忆")
