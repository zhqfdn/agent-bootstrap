#!/usr/bin/env python3
"""
Memory System CLI 接口 - 简化版
用于从外部调用记忆系统
"""

import sys
import json
import os
from pathlib import Path

# 设置路径
WORKSPACE = Path(os.environ.get('OPENCLAW_WORKSPACE', str(Path.home() / '.openclaw' / 'workspace')))
MEMORY_DIR = WORKSPACE / 'memory'
DAILY_DIR = MEMORY_DIR / 'daily'
INDEX_FILE = MEMORY_DIR / '.index' / 'memory.json'

# 确保目录存在
DAILY_DIR.mkdir(parents=True, exist_ok=True)
INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)


def load_index():
    """加载索引"""
    if INDEX_FILE.exists():
        with open(INDEX_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "version": "1.0",
        "totalMemories": 0,
        "dailyFiles": [],
        "tags": {}
    }


def save_index(index):
    """保存索引"""
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def cmd_save(content, memory_type='episodic', tags_str='', emotion=0.5):
    """保存记忆"""
    from datetime import datetime
    
    tags = tags_str.split(',') if tags_str else []
    
    # 生成记忆 ID
    import uuid
    memory_id = str(uuid.uuid4())[:8]
    
    # 创建记忆块
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    
    memory_block = {
        "id": memory_id,
        "type": memory_type,
        "content": content,
        "tags": tags,
        "emotion_level": float(emotion),
        "privacy_level": "P3",
        "created_at": now.isoformat(),
        "accessed_at": now.isoformat(),
        "access_count": 1
    }
    
    # 写入每日文件
    daily_file = DAILY_DIR / f"{date_str}.md"
    
    # 读取现有内容或创建新的
    if daily_file.exists():
        with open(daily_file, 'r', encoding='utf-8') as f:
            content_existing = f.read()
        # 简单追加
        if "---" in content_existing:
            parts = content_existing.split("---", 2)
            if len(parts) >= 3:
                memories = json.loads(parts[1].split("memories: ")[1].split("\n")[0]) if "memories: " in parts[1] else []
                memories.append(memory_block)
                new_content = f"---\ndate: {date_str}\nmemories: {json.dumps(memories)}\n---"
            else:
                new_content = content_existing + f"\n\n---\nDate: {date_str}\nContent: {content}\nTags: {', '.join(tags)}\n"
        else:
            new_content = content_existing
    else:
        new_content = f"---\ndate: {date_str}\nmemories: {json.dumps([memory_block])}\n---\n\n"
    
    with open(daily_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    # 更新索引
    index = load_index()
    index["totalMemories"] = index.get("totalMemories", 0) + 1
    
    if date_str not in index.get("dailyFiles", []):
        index["dailyFiles"] = index.get("dailyFiles", []) + [date_str]
    
    for tag in tags:
        if "tags" not in index:
            index["tags"] = {}
        if not isinstance(index.get("tags"), dict):
            index["tags"] = {}
        index["tags"][tag] = index["tags"].get(tag, 0) + 1
    
    save_index(index)
    
    return {'success': True, 'memory_id': memory_id, 'date': date_str}


def cmd_get_recent(days=7):
    """获取近期记忆"""
    from datetime import datetime, timedelta
    
    memories = []
    cutoff = datetime.now() - timedelta(days=days)
    
    for daily_file in sorted(DAILY_DIR.glob("*.md"), reverse=True):
        try:
            date_str = daily_file.stem
            file_date = datetime.strptime(date_str, "%Y-%m-%d")
            
            if file_date >= cutoff:
                with open(daily_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 简单解析
                if "memories: " in content:
                    mem_part = content.split("memories: ")[1].split("\n---")[0]
                    try:
                        mems = json.loads(mem_part)
                        for m in mems[-3:]:  # 每个文件取最近3条
                            memories.append(m)
                    except:
                        pass
        except:
            continue
    
    return {'success': True, 'memories': memories}


def cmd_search(keyword):
    """搜索记忆"""
    results = []
    
    for daily_file in DAILY_DIR.glob("*.md"):
        try:
            with open(daily_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if keyword.lower() in content.lower():
                if "memories: " in content:
                    mem_part = content.split("memories: ")[1].split("\n---")[0]
                    try:
                        mems = json.loads(mem_part)
                        for m in mems:
                            if keyword.lower() in m.get('content', '').lower():
                                m['file'] = str(daily_file)
                                results.append(m)
                    except:
                        pass
        except:
            continue
    
    return {'success': True, 'results': results}


def cmd_get_preferences():
    """获取用户偏好"""
    index = load_index()
    prefs = index.get("preferences", {})
    return {'success': True, 'preferences': prefs}


def cmd_get_context():
    """获取上下文（用于注入 prompt）"""
    index = load_index()
    recent = cmd_get_recent(3)
    prefs = index.get("preferences", {})
    
    context = {
        'preferences': prefs,
        'recent_memories': recent.get('memories', [])[:5],
    }
    
    return {'success': True, 'context': context}


def cmd_get_stats():
    """获取统计信息"""
    index = load_index()
    
    # 统计
    daily_count = len(list(DAILY_DIR.glob("*.md")))
    
    return {
        'success': True, 
        'stats': {
            'total': index.get('totalMemories', 0),
            'daily_files': daily_count,
            'tags': index.get('tags', {})
        }
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    try:
        if command == 'save':
            content = args[0] if args else ''
            memory_type = args[1] if len(args) > 1 else 'episodic'
            tags = args[2] if len(args) > 2 else ''
            emotion = args[3] if len(args) > 3 else '0.5'
            result = cmd_save(content, memory_type, tags, emotion)
            
        elif command == 'get_recent':
            days = int(args[0]) if args else 7
            result = cmd_get_recent(days)
            
        elif command == 'search':
            keyword = args[0] if args else ''
            result = cmd_search(keyword)
            
        elif command == 'get_preferences':
            result = cmd_get_preferences()
            
        elif command == 'get_context':
            result = cmd_get_context()
            
        elif command == 'get_stats':
            result = cmd_get_stats()
            
        else:
            result = {'success': False, 'error': f'Unknown command: {command}'}
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        import traceback
        print(json.dumps({'success': False, 'error': str(e), 'trace': traceback.format_exc()}))


if __name__ == '__main__':
    main()
