#!/usr/bin/env python3
"""
Helpers - 辅助工具模块
"""

import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional


def format_memory(memory: Dict, max_length: int = 100) -> str:
    """
    格式化记忆为可读字符串
    
    Args:
        memory: 记忆字典
        max_length: 最大长度
    
    Returns:
        格式化后的字符串
    """
    content = memory.get("content", "")
    if len(content) > max_length:
        content = content[:max_length] + "..."
    
    date = memory.get("created_at", "")[:10]
    mem_type = memory.get("type", "episodic")
    tags = memory.get("tags", [])
    
    result = f"[{date}] {mem_type}: {content}"
    
    if tags:
        result += f" ({', '.join(tags)})"
    
    return result


def parse_date(date_str: str) -> Optional[datetime]:
    """
    解析日期字符串
    
    支持格式:
    - 2026-03-13
    - 2026/03/13
    - 2026年03月13日
    - 今天
    - 昨天
    - 3天前
    """
    # 数字日期
    patterns = [
        (r"(\d{4})-(\d{1,2})-(\d{1,2})", "%Y-%m-%d"),
        (r"(\d{4})/(\d{1,2})/(\d{1,2})", "%Y/%m/%d"),
        (r"(\d{4})年(\d{1,2})月(\d{1,2})日", "%Y年%m月%d日"),
    ]
    
    for pattern, fmt in patterns:
        match = re.match(pattern, date_str)
        if match:
            try:
                return datetime.strptime(date_str, fmt)
            except:
                continue
    
    # 相对日期
    if date_str == "今天":
        return datetime.now()
    elif date_str == "昨天":
        return datetime.now() - timedelta(days=1)
    
    # N天前
    match = re.match(r"(\d+)天前", date_str)
    if match:
        days = int(match.group(1))
        return datetime.now() - timedelta(days=days)
    
    return None


def validate_memory(memory: Dict) -> Dict:
    """
    验证记忆结构
    
    Returns:
        {"valid": bool, "errors": List[str]}
    """
    errors = []
    
    required_fields = ["id", "type", "content", "created_at"]
    for field in required_fields:
        if field not in memory:
            errors.append(f"缺少必需字段: {field}")
    
    # 类型检查
    valid_types = ["episodic", "semantic", "procedural", "self"]
    if memory.get("type") not in valid_types:
        errors.append(f"无效的记忆类型: {memory.get('type')}")
    
    # 情感值检查
    emotion = memory.get("emotion_level", 0.5)
    if not (0 <= emotion <= 1):
        errors.append(f"情感值超出范围: {emotion}")
    
    # 隐私级别检查
    valid_privacy = ["P0", "P1", "P2", "P3", "P4"]
    if memory.get("privacy_level") not in valid_privacy:
        errors.append(f"无效的隐私级别: {memory.get('privacy_level')}")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


def generate_summary(memories: List[Dict], max_items: int = 5) -> str:
    """
    生成记忆摘要
    
    Args:
        memories: 记忆列表
        max_items: 最大条目数
    
    Returns:
        摘要字符串
    """
    if not memories:
        return "暂无记忆"
    
    lines = [f"共 {len(memories)} 条记忆:"]
    
    for i, m in enumerate(memories[:max_items]):
        date = m.get("created_at", "")[:10]
        content = m.get("content", "")[:30]
        lines.append(f"{i+1}. [{date}] {content}...")
    
    if len(memories) > max_items:
        lines.append(f"...还有 {len(memories) - max_items} 条")
    
    return "\n".join(lines)


def calculate_importance(memory: Dict) -> float:
    """
    计算记忆重要性分数
    
    考虑因素:
    - 情感强度
    - 访问频率
    - 是否标记为重要
    """
    score = 0.0
    
    # 情感强度 (0-0.4)
    emotion = memory.get("emotion_level", 0.5)
    score += emotion * 0.4
    
    # 访问频率 (0-0.3)
    access_count = memory.get("access_count", 0)
    score += min(access_count / 10, 1) * 0.3
    
    # 标签重要 (0-0.3)
    tags = memory.get("tags", [])
    important_tags = {"重要", "关键", "决策", "初始化", "里程碑"}
    if any(t in important_tags for t in tags):
        score += 0.3
    
    return min(score, 1.0)


def get_privacy_emoji(level: str) -> str:
    """获取隐私级别 emoji"""
    emoji_map = {
        "P0": "🔴",
        "P1": "🟠", 
        "P2": "🟡",
        "P3": "🟢",
        "P4": "⚪"
    }
    return emoji_map.get(level, "⚪")


if __name__ == "__main__":
    # 测试
    print("=== 测试辅助函数 ===")
    
    # 测试日期解析
    dates = ["2026-03-13", "今天", "3天前"]
    for d in dates:
        result = parse_date(d)
        print(f"{d} -> {result}")
    
    print("\n=== 验证记忆 ===")
    test_memory = {
        "id": "test123",
        "type": "episodic",
        "content": "测试记忆",
        "created_at": "2026-03-13T10:00:00",
        "emotion_level": 0.8,
        "privacy_level": "P3"
    }
    result = validate_memory(test_memory)
    print(f"验证结果: {result}")
