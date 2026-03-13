---
name: memory-system
description: "集成记忆系统，自动保存对话和加载历史上下文"
homepage: https://github.com/openclaw/openclaw
metadata:
  {
    "openclaw": {
      "emoji": "🔗",
      "events": ["command", "lifecycle", "session"],
      "requires": { "config": ["workspace.dir"] },
      "install": [{ "id": "workspace", "kind": "workspace", "label": "User workspace" }]
    }
  }
---

# Memory System Hook

> 自动保存对话到记忆系统，并在会话开始时恢复上下文

## 概述

这个 Hook 会在以下时机触发：

- `session_start`: 会话开始时加载历史记忆
- `message_received`: 收到用户消息时处理输入
- `agent_end`: Agent 回复完成后保存对话
- `session_end`: 会话结束时保存最终状态
- `/new` 或 `/reset`: 命令时保存会话

## 功能

1. **会话开始时**：检索相关记忆，恢复上下文
2. **对话过程中**：实时保存关键对话到记忆系统
3. **会话结束时**：保存会话摘要，更新关系状态

## 配置

无需额外配置，Hook 会自动使用 workspace 目录下的 memory-system。

## 依赖

- Python 3.8+
- memory-system 模块（在 workspace/templates/ 目录下）
