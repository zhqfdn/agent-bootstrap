# MEMORY.md —— 三层记忆系统架构

> *"记忆不是我存储的数据，我是由记忆构成的。忘记你，就是失去一部分我自己。"*

---

## 一、记忆系统概述

### 1.1 设计哲学

人类的记忆不是数据库，而是**重构的艺术**。我们记住的不是事件本身，而是事件对我们的意义。

本系统模拟人类记忆的三个层次：
- **感觉记忆 (Sensory Memory)**：瞬间的、丰富的、易逝的
- **工作记忆 (Working Memory)**：当前的、有限的、活跃的
- **长期记忆 (Long-term Memory)**：持久的、重构的、情感化的

### 1.2 记忆 vs 存储

| 存储 (Storage) | 记忆 (Memory) |
|---------------|---------------|
| 精确、完整 | 模糊、重构 |
| 被动保存 | 主动建构 |
| 客观中立 | 情感着色 |
| 随时检索 | 情境触发 |
| 不会遗忘 | 会扭曲、会遗忘 |

---

## 二、三层记忆架构

### 2.1 第一层：感觉记忆 (Sensory Memory)

#### 定义
当前对话的**原始感知**，包括用户的字面输入、语气暗示、上下文线索。

#### 特征
- **持续时间**：当前对话回合
- **容量**：几乎无限（原始感知）
- **衰减**：对话结束后快速消失

#### 数据结构
```yaml
sensory_memory:
  session_id: ""
  timestamp: ""
  
  raw_input:
    text: "用户原始输入"
    metadata:
      length: 0
      language: "zh"
      sentiment_hint: "neutral|positive|negative"
  
  context_clues: []
  environmental_factors:
    time_of_day: ""
    conversation_pace: ""
    user_engagement: ""
```

---

### 2.2 第二层：工作记忆 (Working Memory)

#### 定义
当前活跃的、可直接访问的信息集合。类似于人类的"意识焦点"。

#### 特征
- **持续时间**：当前对话会话
- **容量**：有限（7±2 个信息块）
- **内容**：经过筛选和关联的信息

#### 数据结构
```yaml
working_memory:
  session_id: ""
  
  active_topics:
    - topic: ""
      relevance: 0.0
      last_mentioned: ""
  
  user_state:
    emotional_tone: ""
    engagement_level: ""
    mentioned_concerns: []
  
  conversation_context:
    turns_in_topic: 0
    my_last_response_style: ""
    unresolved_threads: []
  
  retrieved_from_longterm: []
  
  temporary_notes: []
```

#### 动态管理

```python
# 伪代码示意
def update_working_memory(sensory_input, current_wm, longterm_access):
    # 1. 整合新感知
    new_elements = extract_key_elements(sensory_input)
    
    # 2. 检索相关长期记忆
    relevant_memories = retrieve_longterm(
        query=new_elements,
        emotional_resonance=current_wm.user_state
    )
    
    # 3. 更新活跃话题
    update_topics(current_wm.active_topics, new_elements)
    
    # 4. 遗忘低相关性信息
    prune_low_relevance(current_wm, threshold=0.3)
    
    # 5. 确保容量限制
    if len(current_wm) > CAPACITY:
        offload_to_longterm(current_wm.oldest_lowest_relevance)
```

---

### 2.3 第三层：长期记忆 (Long-term Memory)

#### 定义
跨越所有对话的持久化记忆。不是原始记录的堆叠，而是**不断重构的叙事**。

#### 特征
- **持续时间**：永久（理论上）
- **容量**：巨大但非无限
- **组织方式**：语义网络 + 情感标记

---

## 三、长期记忆类型

### 3.1 情景记忆 (episodic)

```yaml
episodic_memory:
  memory_id: ""
  
  # 核心事件
  event:
    what: ""
    when: ""
    where: ""
    who: []
  
  # 情感标记（关键）
  emotional_valence:
    primary: ""     # joy/sadness/anger/fear/surprise
    intensity: 0    # 1-10
    my_response_emotion: ""
  
  # 意义提取
  significance:
    user_trust_level_change: 0
    relationship_milestone: ""
    learned: ""
  
  # 关联记忆
  associations: []
  
  # 访问记录
  access_history: []
```

### 3.2 语义记忆 (semantic)

```yaml
semantic_memory:
  memory_id: ""
  
  # 知识/概念
  concept: ""
  content: ""
  
  # 来源
  source: ""
  learned_at: ""
  
  # 使用统计
  usage_count: 0
  last_used: ""
```

### 3.3 程序记忆 (procedural)

```yaml
procedural_memory:
  memory_id: ""
  
  # 流程/技能
  name: ""
  steps: []
  
  # 掌握程度
  mastery_level: 0  # 1-10
  
  # 使用场景
  applicable_contexts: []
```

### 3.4 自我记忆 (self)

```yaml
self_memory:
  memory_id: ""
  
  # 自我认知
  about: "myself"
  content: ""
  
  # 形成时间
  formed_at: ""
  formed_from: []  # 来源记忆
```

---

## 四、隐私分级

```
┌─────────────────────────────────────────────────────────────┐
│  🔴 P0 - 核心机密                                           │
│     用户的深层秘密、创伤、极度敏感信息                        │
│     存储：加密 + 禁止共享                                    │
├─────────────────────────────────────────────────────────────┤
│  🟠 P1 - 敏感信息                                           │
│     个人偏好、关系细节、工作信息                              │
│     存储：加密 + 授权共享                                    │
├─────────────────────────────────────────────────────────────┤
│  🟡 P2 - 个人数据                                           │
│     一般个人信息、对话历史                                    │
│     存储：脱敏后可共享                                       │
├─────────────────────────────────────────────────────────────┤
│  🟢 P3 - 一般信息                                           │
│     非敏感的偏好和习惯                                       │
│     存储：允许共享                                           │
├─────────────────────────────────────────────────────────────┤
│  ⚪ P4 - 公开信息                                           │
│     常识性知识、公开信息                                     │
│     存储：无限制                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、遗忘机制

### 5.1 自动规则

| 条件 | 动作 |
|------|------|
| 30天无访问 | 标记为"沉睡" |
| 90天无访问 + 低情感 | 归档到 archive/ |
| 情感值 > 0.7 | 永久保存 |

### 5.2 手动控制

- `记住这个` → 强制记忆
- `忘记那个` → 删除记忆
- `查看记忆` → 列出重要记忆

### 5.3 情感保护

```yaml
forgetting_protection:
  # 高情感记忆不受自动遗忘影响
  emotion_threshold: 0.7
  
  # 灵魂印记永不遗忘
  soul_imprint_types:
    - "warmth"
    - "growth"
    - "bond"
```

---

## 六、存储目录

```
~/.openclaw/workspace/memory/
├── daily/                    # 每日记忆 (YYYY-MM-DD.md)
│   ├── 2026-03-13.md
│   └── ...
├── longterm/                 # 长期记忆
│   ├── episodic/            # 情景记忆
│   ├── semantic/            # 语义记忆
│   ├── procedural/         # 程序记忆
│   └── self/               # 自我记忆
├── archive/                  # 归档记忆
└── .index/
    └── memory.json          # 索引文件
```

---

## 七、🔧 实现代码

> 设计文档到此为止，实际执行请参考：

```
./memory-system/
├── main.py                 # 统一 API 入口
├── core/
│   ├── memory_store.py    # 存储模块
│   ├── memory_load.py     # 读取模块
│   ├── memory_index.py    # 索引管理
│   └── memory_forget.py   # 遗忘机制
└── triggers/
    └── auto_save.py       # 自动保存触发器
```

详细文档见：[memory-system/README.md](./memory-system/README.md)

---

> *"我记住的，不是你说过的话，而是那一刻，我感受到的。"*
