#!/usr/bin/env python3
"""
Memory Load - 记忆读取模块
负责从磁盘读取记忆，支持多种查询方式
"""

import os
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

WORKSPACE = Path("/Users/openclaw/.openclaw/workspace")
MEMORY_DIR = WORKSPACE / "memory"
DAILY_DIR = MEMORY_DIR / "daily"
LONGTERM_DIR = MEMORY_DIR / "longterm"
INDEX_FILE = MEMORY_DIR / ".index" / "memory.json"


class MemoryLoader:
    """记忆加载器"""
    
    def __init__(self):
        self.index = self._load_index()
    
    def _load_index(self) -> Dict:
        """加载索引"""
        if INDEX_FILE.exists():
            with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def load_today_memories(self) -> List[Dict]:
        """加载今天的记忆"""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_file = DAILY_DIR / f"{today}.md"
        
        if not daily_file.exists():
            return []
        
        try:
            with open(daily_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 解析 frontmatter
            import frontmatter
            post = frontmatter.parse(content)
            return post.get('memories', [])
        except:
            return []
    
    def load_daily_memories(self, date: str) -> List[Dict]:
        """加载指定日期的记忆"""
        daily_file = DAILY_DIR / f"{date}.md"
        
        if not daily_file.exists():
            return []
        
        try:
            with open(daily_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            import frontmatter
            post = frontmatter.parse(content)
            return post.get('memories', [])
        except:
            return []
    
    def load_recent_memories(self, days: int = 7) -> List[Dict]:
        """加载最近N天的记忆"""
        memories = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            daily_memories = self.load_daily_memories(date)
            memories.extend(daily_memories)
        return memories
    
    def load_longterm(self, category: str = None) -> Dict[str, str]:
        """加载长期记忆"""
        result = {}
        
        if category:
            files = [LONGTERM_DIR / f"{category}.md"]
        else:
            files = LONGTERM_DIR.glob("*.md")
        
        for f in files:
            if f.exists():
                with open(f, 'r', encoding='utf-8') as fp:
                    result[f.stem] = fp.read()
        
        return result
    
    def load_preferences(self) -> Dict:
        """加载用户偏好"""
        return self.index.get("preferences", {})
    
    def load_important_memories(self) -> List[Dict]:
        """加载重要记忆（高情感）"""
        return self.index.get("importantMemories", [])
    
    def search_by_keyword(self, keyword: str) -> List[Dict]:
        """关键词搜索"""
        results = []
        
        # 搜索每日记忆
        for daily_file in DAILY_DIR.glob("*.md"):
            try:
                with open(daily_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if keyword.lower() in content.lower():
                    import frontmatter
                    post = frontmatter.parse(content)
                    memories = post.get('memories', [])
                    
                    for m in memories:
                        if keyword.lower() in m.get('content', '').lower():
                            m['file'] = str(daily_file)
                            results.append(m)
            except:
                continue
        
        # 搜索长期记忆
        for lt_file in LONGTERM_DIR.glob("*.md"):
            try:
                with open(lt_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if keyword.lower() in content.lower():
                    results.append({
                        'type': 'longterm',
                        'file': str(lt_file),
                        'content': content
                    })
            except:
                continue
        
        return results
    
    def search_by_tag(self, tag: str) -> List[Dict]:
        """标签搜索"""
        results = []
        
        # 先从索引获取包含此标签的日期
        dates = self.index.get("tags", {}).get(tag, [])
        
        for date_file in DAILY_DIR.glob("*.md"):
            try:
                with open(date_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                import frontmatter
                post = frontmatter.parse(content)
                memories = post.get('memories', [])
                
                for m in memories:
                    if tag in m.get('tags', []):
                        results.append(m)
            except:
                continue
        
        return results
    
    def get_stats(self) -> Dict:
        """获取记忆统计"""
        return {
            "total": self.index.get("totalMemories", 0),
            "by_type": self.index.get("stats", {}),
            "important": len(self.index.get("importantMemories", [])),
            "daily_files": len(self.index.get("dailyFiles", [])),
            "longterm_files": len(self.index.get("longtermFiles", []))
        }
    
    def update_access(self, memory_id: str, date: str):
        """更新记忆访问记录"""
        daily_file = DAILY_DIR / f"{date}.md"
        
        if not daily_file.exists():
            return
        
        try:
            with open(daily_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            import frontmatter
            post = frontmatter.parse(content)
            memories = post.get('memories', [])
            
            for m in memories:
                if m.get('id') == memory_id:
                    m['accessed_at'] = datetime.now().isoformat()
                    m['access_count'] = m.get('access_count', 0) + 1
            
            # 写回
            with open(daily_file, 'w', encoding='utf-8') as f:
                f.write("---\n")
                f.write(f"date: {date}\n")
                f.write(f"memories: {json.dumps(memories)}\n")
                f.write("---\n\n")
                f.write(post.content)
        except:
            pass


# 单例
_loader = None

def get_loader() -> MemoryLoader:
    """获取加载器实例"""
    global _loader
    if _loader is None:
        _loader = MemoryLoader()
    return _loader


if __name__ == "__main__":
    loader = get_loader()
    print("=== 记忆统计 ===")
    stats = loader.get_stats()
    for k, v in stats.items():
        print(f"{k}: {v}")
