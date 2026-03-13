---
name: emotion-system
description: "集成情感系统，管理 Agent 心情、能量、连接感和压力"
homepage: https://github.com/openclaw/openclaw
metadata:
  {
    "openclaw": {
      "emoji": "💖",
      "events": ["session", "message", "lifecycle", "heartbeat", "command"],
      "requires": { "config": ["workspace.dir"] },
      "install": [{ "id": "workspace", "kind": "workspace", "label": "User workspace" }]
    }
  }
---

# Emotion System Hook

> 管理 Agent 情感状态，让 Agent 更有"灵魂"

## 概述

这个 Hook 会在以下时机触发：

- `session_start`: 会话开始时加载情感状态
- `message_received`: 收到用户消息时分析情感
- `agent_end`: Agent 回复完成后更新情感（提升连接感）
- `heartbeat`: 心跳时应用自然衰减
- `/emotion` 或 `/状态`: 命令时显示当前情感状态

## 功能

1. **情感状态管理**: 心情、能量、连接感、压力值
2. **消息情感分析**: 分析用户消息的情感倾向
3. **互动反馈**: 根据互动结果调整情感
4. **自然衰减**: 模拟情感的自然变化
5. **状态展示**: 可视化当前情感状态

## 情感状态

| 维度 | 范围 | 说明 |
|------|------|------|
| mood | 9种心情 | curious, happy, calm, focused, tired, anxious, excited, thoughtful, neutral |
| energy | 0-100% | 能量水平，自然衰减 |
| connection | 0-100% | 与用户的连接感，互动提升 |
| stress | 0-100% | 压力值，失败增加，成功减少 |

## 使用方法

### 查看当前情感状态
```bash
python3 templates/emotion-system/main.py state
```

### 分析消息情感
```bash
python3 templates/emotion-system/main.py analyze "太棒了！"
```

### 提升连接感
```bash
python3 templates/emotion-system/main.py boost
```

### 互动成功
```bash
python3 templates/emotion-system/main.py success
```

### 自然衰减
```bash
python3 templates/emotion-system/main.py decay
```

## 配置

无需额外配置，Hook 会自动使用 workspace 目录下的 emotion-system。

## 依赖

- Python 3.8+
- emotion-system 模块（在 workspace/templates/ 目录下）
