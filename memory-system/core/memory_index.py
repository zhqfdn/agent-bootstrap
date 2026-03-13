#!/usr/bin/env python3
"""
Memory Index - 索引管理模块
负责维护记忆索引，支持快速查询
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

WORKSPACE = Path("/Users/openclaw/.openclaw/workspace")
MEMORY_DIR = WORKSPACE / "memory"
INDEX_FILE = MEMORY_DIR / ".index" / "memory.json"


class MemoryIndex:
    """记忆索引管理器"""
    
    def __init__(self):
        self.index = self._load_or_create()
    
    def _load_or_create(self) -> Dict:
        """加载或创建索引"""
        if INDEX_FILE.exists():
            with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return self._create_default()
    
    def _create_default(self) -> Dict:
        """创建默认索引"""
        index = {
            "version": "1.0",
            "created_at": datetime.now().isoformat(),
            "lastUpdated": datetime.now().isoformat(),
            "totalMemories": 0,
            "importantMemories": [],
            "preferences": {
                "agentName": "",
                "agentRole": "",
                "userName": "",
                "communicationStyle": "",
                "problemApproach": ""
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
        self._save(index)
        return index
    
    def _save(self, index: Dict = None):
        """保存索引"""
        if index is None:
            index = self.index
        
        index["lastUpdated"] = datetime.now().isoformat()
        
        # 确保目录存在
        INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
    
    def add_memory(self, memory: Dict):
        """添加记忆到索引"""
        self.index["totalMemories"] += 1
        
        # 更新类型统计
        mem_type = memory.get("type", "episodic")
        self.index["stats"][mem_type] = self.index["stats"].get(mem_type, 0) + 1
        
        # 更新标签
        for tag in memory.get("tags", []):
            if tag not in self.index["tags"]:
                self.index["tags"][tag] = 0
            self.index["tags"][tag] += 1
        
        # 重要记忆
        if memory.get("emotion_level", 0) > 0.7:
            self.index["importantMemories"].append({
                "id": memory.get("id"),
                "date": memory.get("created_at", "")[:10],
                "preview": memory.get("content", "")[:50]
            })
        
        self._save()
    
    def remove_memory(self, memory_id: str):
        """从索引移除记忆"""
        self.index["totalMemories"] = max(0, self.index["totalMemories"] - 1)
        
        # 从重要记忆中移除
        self.index["importantMemories"] = [
            m for m in self.index["importantMemories"] 
            if m.get("id") != memory_id
        ]
        
        self._save()
    
    def update_preferences(self, prefs: Dict):
        """更新偏好"""
        self.index["preferences"].update(prefs)
        self._save()
    
    def get_preferences(self) -> Dict:
        """获取偏好"""
        return self.index.get("preferences", {})
    
    def add_daily_file(self, date: str):
        """添加每日文件"""
        if date not in self.index["dailyFiles"]:
            self.index["dailyFiles"].append(date)
            self.index["dailyFiles"].sort()
            self._save()
    
    def add_longterm_file(self, category: str):
        """添加长期文件"""
        if category not in self.index["longtermFiles"]:
            self.index["longtermFiles"].append(category)
            self._save()
    
    def get_all_tags(self) -> List[str]:
        """获取所有标签"""
        return list(self.index.get("tags", {}).keys())
    
    def get_tag_count(self, tag: str) -> int:
        """获取标签使用次数"""
        return self.index.get("tags", {}).get(tag, 0)
    
    def rebuild_from_files(self):
        """从文件重建索引"""
        # TODO: 扫描所有记忆文件重建索引
        pass
    
    def verify_integrity(self) -> Dict:
        """验证索引完整性"""
        issues = []
        
        # 检查文件是否存在
        for date in self.index.get("dailyFiles", []):
            daily_file = MEMORY_DIR / "daily" / f"{date}.md"
            if not daily_file.exists():
                issues.append(f"缺失: {daily_file}")
        
        for category in self.index.get("longtermFiles", []):
            lt_file = MEMORY_DIR / "longterm" / f"{category}.md"
            if not lt_file.exists():
                issues.append(f"缺失: {lt_file}")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "totalMemories": self.index.get("totalMemories", 0)
        }


# 单例
_index = None

def get_index() -> MemoryIndex:
    """获取索引实例"""
    global _index
    if _index is None:
        _index = MemoryIndex()
    return _index


if __name__ == "__main__":
    idx = get_index()
    print("=== 索引状态 ===")
    print(f"总记忆: {idx.index['totalMemories']}")
    print(f"标签: {idx.get_all_tags()}")
    print(f"完整性: {idx.verify_integrity()}")
