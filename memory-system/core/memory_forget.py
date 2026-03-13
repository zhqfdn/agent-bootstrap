#!/usr/bin/env python3
"""
Memory Forget - 遗忘机制模块
负责记忆的自动遗忘和清理
"""

import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

WORKSPACE = Path("/Users/openclaw/.openclaw/workspace")
MEMORY_DIR = WORKSPACE / "memory"
DAILY_DIR = MEMORY_DIR / "daily"
ARCHIVE_DIR = MEMORY_DIR / "archive"
INDEX_FILE = MEMORY_DIR / ".index" / "memory.json"


# 配置
CONFIG = {
    "dormant_days": 30,      # 30天无访问 = 沉睡
    "archive_days": 90,     # 90天无访问 = 归档
    "min_emotion_forget": 0.3,  # 低于此情感值可遗忘
    "max_memories_per_day": 100,  # 每日最大记忆数
}


class MemoryForgetting:
    """记忆遗忘管理器"""
    
    def __init__(self, config: Dict = None):
        self.config = CONFIG.copy()
        if config:
            self.config.update(config)
        
        # 确保目录存在
        ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    
    def _load_index(self) -> Dict:
        """加载索引"""
        if INDEX_FILE.exists():
            with open(INDEX_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def _save_index(self, index: Dict):
        """保存索引"""
        index["lastUpdated"] = datetime.now().isoformat()
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
    
    def get_dormant_memories(self, days: int = None) -> List[Dict]:
        """获取沉睡记忆（超过N天未访问）"""
        days = days or self.config["dormant_days"]
        cutoff = datetime.now() - timedelta(days=days)
        dormant = []
        
        for daily_file in DAILY_DIR.glob("*.md"):
            try:
                # 从文件名提取日期
                date_str = daily_file.stem
                file_date = datetime.strptime(date_str, "%Y-%m-%d")
                
                # 只检查旧文件
                if file_date > cutoff:
                    continue
                
                with open(daily_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                import frontmatter
                post = frontmatter.parse(content)
                memories = post.get('memories', [])
                
                for m in memories:
                    last_access = datetime.fromisoformat(m.get('accessed_at', m.get('created_at')))
                    if last_access < cutoff:
                        # 检查情感值，低情感可遗忘
                        if m.get('emotion_level', 0.5) < self.config["min_emotion_forget"]:
                            m['file'] = str(daily_file)
                            m['date'] = date_str
                            dormant.append(m)
            except:
                continue
        
        return dormant
    
    def get_archive_candidates(self, days: int = None) -> List[str]:
        """获取可归档的日期"""
        days = days or self.config["archive_days"]
        cutoff = datetime.now() - timedelta(days=days)
        candidates = []
        
        for daily_file in DAILY_DIR.glob("*.md"):
            try:
                date_str = daily_file.stem
                file_date = datetime.strptime(date_str, "%Y-%m-%d")
                
                if file_date < cutoff:
                    candidates.append(date_str)
            except:
                continue
        
        return sorted(candidates)
    
    def archive_day(self, date: str) -> bool:
        """归档指定日期的记忆"""
        source = DAILY_DIR / f"{date}.md"
        target = ARCHIVE_DIR / f"{date}.md"
        
        if not source.exists():
            return False
        
        try:
            # 移动文件
            source.rename(target)
            
            # 更新索引
            index = self._load_index()
            if date in index.get("dailyFiles", []):
                index["dailyFiles"].remove(date)
                index["archivedFiles"] = index.get("archivedFiles", [])
                index["archivedFiles"].append(date)
                self._save_index(index)
            
            return True
        except Exception as e:
            print(f"归档失败: {e}")
            return False
    
    def forget_memory(self, memory_id: str, date: str) -> bool:
        """删除指定记忆"""
        daily_file = DAILY_DIR / f"{date}.md"
        
        if not daily_file.exists():
            return False
        
        try:
            with open(daily_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            import frontmatter
            post = frontmatter.parse(content)
            memories = post.get('memories', [])
            
            # 移除
            memories = [m for m in memories if m.get('id') != memory_id]
            
            # 写回
            with open(daily_file, 'w', encoding='utf-8') as f:
                f.write("---\n")
                f.write(f"date: {date}\n")
                f.write(f"memories: {json.dumps(memories)}\n")
                f.write("---\n\n")
                f.write(post.content)
            
            # 更新索引
            index = self._load_index()
            index["totalMemories"] = max(0, index.get("totalMemories", 1) - 1)
            self._save_index(index)
            
            return True
        except Exception as e:
            print(f"删除失败: {e}")
            return False
    
    def run_auto_cleanup(self) -> Dict:
        """运行自动清理"""
        results = {
            "archived": [],
            "forgotten": [],
            "errors": []
        }
        
        # 1. 归档老文件
        candidates = self.get_archive_candidates()
        for date in candidates:
            if self.archive_day(date):
                results["archived"].append(date)
        
        # 2. 标记沉睡记忆
        dormant = self.get_dormant_memories()
        results["dormant_count"] = len(dormant)
        
        return results
    
    def get_forgetting_stats(self) -> Dict:
        """获取遗忘统计"""
        index = self._load_index()
        
        # 统计各时期记忆
        now = datetime.now()
        recent_count = 0
        dormant_count = 0
        archived_count = 0
        
        for daily_file in DAILY_DIR.glob("*.md"):
            try:
                date_str = daily_file.stem
                file_date = datetime.strptime(date_str, "%Y-%m-%d")
                
                days_ago = (now - file_date).days
                if days_ago < 30:
                    recent_count += 1
                else:
                    dormant_count += 1
            except:
                continue
        
        archived_count = len(list(ARCHIVE_DIR.glob("*.md")))
        
        return {
            "recent_days": recent_count,
            "dormant_days": dormant_count,
            "archived": archived_count,
            "total_indexed": index.get("totalMemories", 0)
        }


# 单例
_forgetter = None

def get_forgetter(config: Dict = None) -> MemoryForgetting:
    """获取遗忘管理器实例"""
    global _forgetter
    if _forgetter is None:
        _forgetter = MemoryForgetting(config)
    return _forgetter


if __name__ == "__main__":
    forgetter = get_forgetter()
    print("=== 遗忘统计 ===")
    stats = forgetter.get_forgetting_stats()
    for k, v in stats.items():
        print(f"{k}: {v}")
    
    print("\n=== 自动清理 ===")
    results = forgetter.run_auto_cleanup()
    print(f"归档: {results['archived']}")
    print(f"沉睡: {results.get('dormant_count', 0)}")
