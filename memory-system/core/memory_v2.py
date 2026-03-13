#!/usr/bin/env python3
"""
增强版记忆系统 - Enhanced Memory System v2.0
添加可选向量搜索支持
"""

import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class MemoryBlock:
    """记忆块"""
    id: str
    type: str  # episodic, semantic, procedural, self
    content: str
    tags: List[str]
    created_at: str


class EnhancedMemoryStore:
    """增强版记忆存储器"""
    
    def __init__(self, use_vector: bool = False):
        self.workspace = Path.home() / ".openclaw" / "workspace"
        self.memory_dir = self.workspace / "memory"
        self.daily_dir = self.memory_dir / "daily"
        self.longterm_dir = self.memory_dir / "longterm"
        self.index_file = self.memory_dir / ".index" / "memory.json"
        
        # 向量搜索（可选）
        self.use_vector = use_vector
        self.embeddings = {}
        
        self._ensure_directories()
        self.index = self._load_index()
    
    def _ensure_directories(self):
        """确保目录存在"""
        self.daily_dir.mkdir(parents=True, exist_ok=True)
        self.longterm_dir.mkdir(parents=True, exist_ok=True)
        (self.memory_dir / ".index").mkdir(parents=True, exist_ok=True)
    
    def _load_index(self) -> Dict:
        """加载索引"""
        if self.index_file.exists():
            try:
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        return self._create_default_index()
    
    def _create_default_index(self) -> Dict:
        """创建默认索引"""
        index = {
            "version": "2.0",
            "last_updated": datetime.now().isoformat(),
            "total_memories": 0,
            "daily_files": [],
            "longterm_files": [],
            "tags": {},
            "preferences": {}
        }
        self._save_index(index)
        return index
    
    def _save_index(self, index: Dict):
        """保存索引"""
        index["last_updated"] = datetime.now().isoformat()
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
    
    def _generate_id(self) -> str:
        """生成唯一ID"""
        return hashlib.md5(str(datetime.now()).encode()).hexdigest()[:8]
    
    def save_daily_memory(self, content: str, memory_type: str = "episodic",
                          tags: List[str] = None, metadata: Dict = None) -> str:
        """保存每日记忆"""
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        
        memory_id = self._generate_id()
        
        memory_block = {
            "id": memory_id,
            "type": memory_type,
            "content": content,
            "tags": tags or [],
            "created_at": now.isoformat(),
            "metadata": metadata or {}
        }
        
        # 写入当日文件
        daily_file = self.daily_dir / f"{date_str}.md"
        self._append_to_daily_file(daily_file, memory_block)
        
        # 更新索引
        self.index["total_memories"] += 1
        if date_str not in self.index["daily_files"]:
            self.index["daily_files"].append(date_str)
            self.index["daily_files"].sort()
        
        for tag in tags or []:
            self.index["tags"][tag] = self.index["tags"].get(tag, 0) + 1
        
        # 可选：生成向量嵌入
        if self.use_vector:
            self._store_embedding(memory_id, content)
        
        self._save_index(self.index)
        return memory_id
    
    def _append_to_daily_file(self, file_path: Path, memory_block: Dict):
        """追加记忆到每日文件"""
        import frontmatter
        
        if file_path.exists():
            try:
                post = frontmatter.load(file_path)
                memories = list(post.get('memories', []))
                memories.append(memory_block)
                content = post.content
            except:
                content = ""
                memories = [memory_block]
        else:
            content = ""
            memories = [memory_block]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("---\n")
            f.write(f"date: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"memories: {json.dumps(memories)}\n")
            f.write("---\n\n")
            f.write(content)
    
    def _store_embedding(self, memory_id: str, content: str):
        """存储向量嵌入（简化版）"""
        # 这里可以使用实际的嵌入模型
        # 当前使用简单的哈希作为占位符
        self.embeddings[memory_id] = {
            "content": content,
            "hash": hashlib.md5(content.encode()).hexdigest()
        }
    
    def search(self, query: str, use_vector: bool = None) -> List[Dict]:
        """搜索记忆"""
        # 决定使用哪种搜索
        if use_vector is None:
            use_vector = self.use_vector
        
        if use_vector and self.use_vector:
            return self._vector_search(query)
        else:
            return self._keyword_search(query)
    
    def _keyword_search(self, query: str) -> List[Dict]:
        """关键词搜索"""
        results = []
        query_lower = query.lower()
        
        # 搜索每日文件
        for daily_file in self.daily_dir.glob("*.md"):
            try:
                with open(daily_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if query_lower in content.lower():
                        # 简单提取
                        results.append({
                            "file": str(daily_file),
                            "content": content[:200],
                            "type": "daily"
                        })
            except:
                pass
        
        # 搜索长期记忆
        for lt_file in self.longterm_dir.glob("*.md"):
            try:
                with open(lt_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if query_lower in content.lower():
                        results.append({
                            "file": str(lt_file),
                            "content": content[:200],
                            "type": "longterm"
                        })
            except:
                pass
        
        return results[:10]  # 限制结果数量
    
    def _vector_search(self, query: str) -> List[Dict]:
        """向量搜索（简化版）"""
        # 这里应该使用实际的向量相似度计算
        # 当前简化为关键词搜索 + 向量标记
        return self._keyword_search(query)
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        daily_count = len(list(self.daily_dir.glob("*.md")))
        longterm_count = len(list(self.longterm_dir.glob("*.md")))
        
        return {
            "total_memories": self.index.get("total_memories", 0),
            "daily_files": daily_count,
            "longterm_files": longterm_count,
            "tags_count": len(self.index.get("tags", {})),
            "vector_enabled": self.use_vector
        }
    
    def update_preferences(self, prefs: Dict):
        """更新偏好"""
        self.index["preferences"].update(prefs)
        self._save_index(self.index)
        
        # 同时更新 longterm 文件
        prefs_file = self.longterm_dir / "preferences.md"
        prefs_content = "# 用户偏好\n\n"
        for k, v in prefs.items():
            prefs_content += f"- **{k}**: {v}\n"
        
        with open(prefs_file, 'w', encoding='utf-8') as f:
            f.write(prefs_content)


# 单例
_store = None

def get_store(use_vector: bool = False) -> EnhancedMemoryStore:
    global _store
    if _store is None:
        _store = EnhancedMemoryStore(use_vector)
    return _store


if __name__ == "__main__":
    store = EnhancedMemoryStore()
    
    print("=== 记忆系统 v2.0 ===")
    print(json.dumps(store.get_stats(), indent=2, ensure_ascii=False))
    
    # 测试搜索
    print("\n=== 搜索测试 ===")
    results = store.search("偏好")
    print(f"找到 {len(results)} 条结果")
