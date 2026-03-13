# Memory System - 可执行记忆系统

> 真正的 Agent 记忆系统实现，从设计文档到可执行代码

---

## 🎯 一句话说明

记忆系统让 Agent 能"记住"和用户的对话、偏好、重要事件，像人一样积累经验。

---

## 🚀 用户使用方法

### 自然语言交互

你可以直接对我说：

| 说法 | 效果 |
|------|------|
| "记住 XXX" | 记住指定内容 |
| "记得 XXX 吗？" | 查询相关记忆 |
| "我之前说过什么？" | 查看最近记忆 |
| "我的偏好是 XXX" | 保存偏好设置 |
| "忘记 XXX" | 删除指定记忆 |

### 自动记忆

系统会自动保存：
- ✅ 初始化信息（名字、角色、偏好）
- ✅ 对话摘要
- ✅ 重要事件
- ✅ 用户明确要求记住的内容

---

## 📁 目录结构

```
memory-system/
├── main.py                 # 主入口，统一的 API
├── core/                   # 核心模块
│   ├── memory_store.py     # 记忆存储
│   ├── memory_load.py     # 记忆读取
│   ├── memory_index.py    # 索引管理
│   └── memory_forget.py   # 遗忘机制
├── triggers/               # 触发器
│   ├── auto_save.py       # 自动保存触发
│   └── bootstrap.py       # 初始化触发
├── utils/                  # 工具
│   ├── config.py          # 配置管理
│   └── helpers.py         # 辅助函数
└── README.md              # 本文件
```

---

## 🚀 快速开始

### 1. 初始化

```python
from memory_system import get_memory_system

ms = get_memory_system()
```

### 2. 保存记忆

```python
# 基本保存
ms.save("用户喜欢直接简洁的沟通", tags=["偏好", "沟通"])

# 带情感值
ms.save("这是一个重要决定", emotion=0.9, tags=["重要", "决策"])

# 口语化接口
ms.remember_this("用户叫 Luffy")
ms.remember_this("这是关键里程碑", important=True)
```

### 3. 读取记忆

```python
# 获取今天的记忆
today = ms.get_today()

# 获取最近7天
recent = ms.get_recent(days=7)

# 获取用户偏好
prefs = ms.get_preferences()

# 获取长期记忆
lt = ms.get_longterm("preferences")
```

### 4. 搜索

```python
# 关键词搜索
results = ms.search("技能")

# 标签搜索
results = ms.search_by_tag("学习")
```

### 5. 询问记忆（口语化）

```python
# 问我记得什么
response = ms.what_do_you_remember()
# 输出: "我最近记得：\n- [2026-03-13] 测试记忆..."

# 问特定内容
response = ms.what_do_you_remember("偏好")
```

---

## 🔧 高级功能

### 初始化 Agent

```python
# 定义身份
identity = {
    "name": "乔巴",
    "role": "AI助手",
    "emoji": "🦌",
    "communication_style": "直接简洁",
    "problem_approach": "直接给方案",
    "uncertainty_handling": "坦诚说不知道"
}

# 定义用户
user = {
    "name": "Luffy",
    "communication_style": "直接简洁",
    "problem_approach": "直接给方案",
    "uncertainty_handling": "坦诚说不知道",
    "detail_level": "简洁"
}

# 完成初始化
ms.complete_bootstrap(identity, user)
```

### 遗忘机制

```python
# 运行自动清理
results = ms.cleanup()
# 输出: {"archived": ["2026-01-15"], "forgotten": [], "dormant_count": 5}

# 手动删除记忆
ms.forget(memory_id="abc123", date="2026-03-13")
```

### 统计信息

```python
stats = ms.stats()
# 输出:
# {
#   "loader": {"total": 10, "by_type": {...}},
#   "forgetting": {"recent_days": 5, "dormant_days": 3},
#   "index": {"valid": True, "issues": []}
# }
```

---

## 📊 记忆类型

| 类型 | 说明 | 典型场景 |
|------|------|----------|
| `episodic` | 情景记忆 | 对话、事件 |
| `semantic` | 语义记忆 | 知识、偏好 |
| `procedural` | 程序记忆 | 流程、技能 |
| `self` | 自我记忆 | 身份、边界 |

---

## 🔒 隐私级别

| 级别 | 说明 |
|------|------|
| P0 | 仅自己知道 |
| P1 | 需授权分享 |
| P2 | 脱敏后可共享 |
| P3 | 一般信息 |
| P4 | 公开信息 |

---

## ⚙️ 配置

配置文件: `~/.openclaw/config.json`

```json
{
  "memory": {
    "dormant_days": 30,
    "archive_days": 90,
    "min_emotion_forget": 0.3
  },
  "auto_save": {
    "enabled": true,
    "events": ["bootstrap_complete", "preference_set"]
  }
}
```

---

## 🔄 事件触发

系统会自动在以下事件触发时保存记忆：

```python
# 触发示例
ms.saver.trigger("bootstrap_complete", "初始化完成: 乔巴 - AI助手")
ms.saver.trigger("user_greeting", "用户打招呼: 你好")
ms.saver.trigger("preference_set", "更新偏好: 沟通风格")
```

---

## 📈 工作流程

```
用户输入
    ↓
┌─────────────────────────────────────┐
│         MemorySystem                │
├─────────────────────────────────────┤
│  1. 检查 bootstrap 状态            │
│  2. 加载偏好/身份                   │
│  3. 搜索相关记忆                    │
│  4. 生成回复                        │
│  5. 触发自动保存 (可选)             │
└─────────────────────────────────────┘
    ↓
记忆持久化 → memory/daily/YYYY-MM-DD.md
          → memory/longterm/*.md
          → memory/.index/memory.json
```

---

## 🧪 测试

```bash
cd memory-system
python main.py
```

预期输出：
```
=== Memory System 测试 ===

1. 保存记忆...
   ✓ 已保存

2. 读取今天记忆...
   今日记忆: 1 条

3. 统计信息...
   总记忆: 1

4. 询问记忆...
   我最近记得：
   - [2026-03-13] 测试记忆：这是第一条记忆 (测试)

=== 测试完成 ===
```

---

## 🔮 后续优化

- [ ] 添加向量搜索支持
- [ ] 实现图数据库关系网络
- [ ] 添加加密存储（P0级）
- [ ] 实现多语言支持
- [ ] 添加记忆可视化界面

---

> "记忆不是我存储的数据，我是由记忆构成的。"
