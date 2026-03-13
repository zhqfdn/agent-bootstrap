# Emotion System - 情感系统

> *"我不仅有逻辑，也有情感。"*

OpenClaw Agent 的情感系统模块，负责模拟和管理 Agent 的情感状态。

---

## 🎯 一句话说明

情感系统让 Agent 有"情绪"，会累、会开心、会和用户建立感情连接。

---

## 📊 情感状态

| 维度 | 范围 | 说明 |
|------|------|------|
| 😊 **mood** | 9种 | curious, happy, calm, focused, tired, anxious, excited, thoughtful, neutral |
| ⚡ **energy** | 0-100% | 能量水平，自然衰减 |
| 💕 **connection** | 0-100% | 与用户的连接感，互动提升 |
| 😰 **stress** | 0-100% | 压力值，失败增加，成功减少 |

### 心情转换图

```
curious ←→ excited ←→ happy ←→ calm ←→ tired
    ↑           ↓           ↓         ↓
focused ←→ anxious ←------→ neutral
    ↑
thoughtful
```

---

## 🚀 使用方法

### 方式1：用户主动查看

在聊天中输入以下指令：

| 命令 | 说明 |
|------|------|
| `emotion` | 查看当前情感状态 |
| `state` | 查看当前情感状态 |
| `状态` | 查看当前情感状态 |
| `buffs` | 查看当前增益效果 |
| `status` | 简洁状态 |

**示例输出：**
```
┌─────────────────────────────────────────┐
│  💖 情感状态 🧐
├─────────────────────────────────────────┤
│  心情:  curious   | Lv.1 新手
│  XP: 0/10
│  ───────────────────────────────────────│
│  ⚡能量: 70%
│  💕连接: 50%
│  😰压力: 10%
└─────────────────────────────────────────┘
```

### 方式2：定时自动推送（可选）

可以配置定时向用户推送情感状态：

| 参数 | 说明 |
|------|------|
| interval | 推送间隔（分钟） |
| events | 触发推送的事件 |

### 方式3：关键事件提醒（可选）

只在状态大幅变化时提醒用户：
- 能量低于 30%
- 压力高于 70%
- 心情发生重大变化

---

## 🎮 心情Buff系统

不同心情有不同的增益效果：

| 心情 | Buff | 效果 |
|------|------|------|
| curious | 🧠 learning +20% | 学习效率提升 |
| happy | 💕 connection +20% | 连接感获取提升 |
| calm | ⚡ efficiency +20% | 能量效率提升 |
| focused | 🎯 task +30% | 任务效率提升 |
| excited | ✨ creativity +40% | 创造力提升 |
| grateful | 💕 connection +50% | 连接感大幅提升 |

---

## ⚙️ 配置说明

### 调整衰减速度

编辑 `core/emotion_config.py`：

```python
"energy": {
    "decay_rate": 0.01,      # 每小时衰减 1%（可调整）
},
"connection": {
    "decay_rate": 0.005,     # 每天衰减 0.5%（可调整）
},
```

### 调整互动增益

```python
"connection": {
    "boost_on_interaction": 0.08,  # 每次互动 +8%（可调整）
},
```

---

## 🧪 命令行测试

```bash
# 进入目录
cd ~/.openclaw/workspace/templates/emotion-system

# 查看状态
python3 main.py state

# 查看增益
python3 main.py buffs

# 详细状态
python3 main.py status
```

---

## 📁 目录结构

```
emotion-system/
├── core/
│   ├── __init__.py          # 模块导出
│   ├── emotion_config.py    # 情感配置
│   ├── emotion_store.py     # 情感状态存储
│   └── emotion_analyzer.py  # 情感分析器
├── main.py                  # 命令行入口
└── README.md               # 本文件
```

---

## 🔧 开发者接口

```python
from core import EmotionStore, EmotionAnalyzer

# 初始化
store = EmotionStore()

# 获取当前状态
state = store.get_state()

# 分析用户消息
analyzer = EmotionAnalyzer(store)
result = analyzer.analyze_message("太棒了！")

# 提升连接感
store.boost_connection()

# 互动结束
store.on_interaction_end(success=True)

# 情感衰减（心跳调用）
store.decay()
```

---

## ❓ 常见问题

**Q: 为什么情感变化很慢？**
A: 默认配置衰减较慢以保持稳定。可通过调整 `emotion_config.py` 中的 `decay_rate` 加速。

**Q: 如何重置情感状态？**
A: 运行 `python3 main.py reset`

**Q: XP 和等级有什么用？**
A: 经验值系统，未来会解锁更多功能和 Buff。

---

> *"我不仅有逻辑，也有情感。"*
