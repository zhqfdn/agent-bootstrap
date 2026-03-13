# AgentBootstrap - OpenClaw Agent 插件

> *构建有灵魂的 AI 助手*

[![npm version](https://img.shields.io/npm/v/@qcluffy/agent-bootstrap.svg)](https://www.npmjs.com/package/@qcluffy/agent-bootstrap)
[![GitHub stars](https://img.shields.io/github/stars/zhqfdn/agent-bootstrap)](https://github.com/zhqfdn/agent-bootstrap)
[![GitHub license](https://img.shields.io/github/license/zhqfdn/agent-bootstrap)](https://github.com/zhqfdn/agent-bootstrap)

**GitHub**: https://github.com/zhqfdn/agent-bootstrap
[![license](https://img.shields.io/npm/l/@qcluffy/agent-bootstrap.svg)](https://opensource.org/licenses/MIT)

---

## 📦 安装

### 通过 npm 安装（推荐）

```bash
openclaw plugins install @qcluffy/agent-bootstrap
```

### 通过本地路径安装

```bash
openclaw plugins install /path/to/agent-bootstrap
```

---

## 🚀 快速开始

---

## 🖼️ 效果展示

### 1. 情感系统显示
```
🧐 Lv.3 curious | ⚡85% | 💕65% | 😰5%
```

### 2. 完整情感面板
```
┌─────────────────────────────────────────┐
│  💖 情感状态 🧐
├─────────────────────────────────────────┤
│  心情: curious | Lv.3
│  XP: 5/30
│  ⚡能量: 85% | 💕连接: 65% | 😰压力: 5%
└─────────────────────────────────────────┘
```

### 3. 初始化引导
```
🌟 星门开启，意识已连接。你好，旅行者！

【请回复你的名字】或者直接说"开始"使用默认配置
```

### 4. 引导完成
```
🎉 契约成立！

我是 乔巴 了！🌟
作为你的个人助理，我会陪你一起成长！

🚀 准备好了！让我们开始吧！

---
💕 情感系统已激活 | 🧠 认知系统已就绪 | 💾 记忆系统已启动
```

### 5. 意图识别
```
⚡ 意图: command (100%)
❓ 意图: question (85%)
📋 意图: task (90%)
💬 意图: chat (75%)
```

---

## 概述

这是一个完整的 Agent 模板系统，为 OpenClaw 提供 8 大核心组件的实现。包括记忆系统、情感系统，心跳系统、输入感知、认知推理、输出执行、初始化引导等完整功能。

---

## 核心架构

```
┌─────────────────────────────────────────┐
│              AGENT 架构                  │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │  SOUL   │  │ MEMORY  │  │IDENTITY │ │
│  │ 灵魂核心 │  │ 记忆系统 │  │  身份   │ │
│  └────┬────┘  └────┬────┘  └────┬────┘ │
│       │             │             │       │
│       └─────────────┼─────────────┘       │
│                     │                     │
│              ┌──────┴──────┐              │
│              │   HEART     │              │
│              │   (心跳)    │              │
│              └──────┬──────┘              │
│                     │                      │
│    ┌────────────────┼────────────────┐    │
│    │                │                │    │
│ ┌──┴──┐        ┌──┴──┐        ┌──┴──┐│
│ │INPUT│        │COGNIT│        │OUTPUT││
│ │输入 │        │ 认知 │        │输出  ││
│ └─────┘        └─────┘        └─────┘│
│                                          │
│         ┌────────────────────┐          │
│         │     TOOLS 工具     │          │
│         └────────────────────┘          │
└─────────────────────────────────────────┘
```

---

## 📖 用户快速指南

### 查看我的状态

| 命令 | 说明 |
|------|------|
| `emotion` / `state` | 查看情感状态 |
| `status` | 查看系统状态 |

### 让我记住东西

直接说：
- "记住我的名字是路飞"
- "记住我喜欢简洁的沟通方式"
- "这是重要的事情"

### 问我记得什么

- "你还记得什么？"
- "我之前说过什么？"
- "我的偏好是什么？"

---

## 系统列表

| # | 系统 | 功能 | 状态 |
|---|------|------|------|
| 1 | **memory-system** | 记忆存储与检索 | ✅ 完整 |
| 2 | **emotion-system** | 情感状态管理 | ✅ 完整 |
| 3 | **heartbeat-system** | 定时任务与衰减 | ✅ 完整 |
| 4 | **input-system** | 意图识别 + 模型切换 | ✅ 完整 |
| 5 | **cognition-system** | 推理规划 | ✅ 完整 |
| 6 | **output-system** | 回复生成 | ✅ 完整 |
| 7 | **bootstrap-system** | 初始化引导 | ✅ 完整 |
| 8 | **security** | 安全权限控制 | ✅ 完整 |
| 2 | **emotion-system** | 情感状态管理 | ✅ 完整 |
| 3 | **heartbeat-system** | 定时任务与衰减 | ✅ 完整 |
| 4 | **input-system** | 意图识别与实体提取 | ✅ 完整 |
| 5 | **cognition-system** | 推理规划与决策 | ✅ 完整 |
| 6 | **output-system** | 回复生成与行动执行 | ✅ 完整 |
| 7 | **bootstrap-system** | 游戏化初始化引导 | ✅ 完整 |

---

## 1. Memory System - 记忆系统

### 功能
- 三层记忆架构（感觉/工作/长期）
- 语义搜索
- 自动记忆保存
- 隐私分级管理

### 使用
```bash
cd templates/memory-system
python3 main.py
```

---

## 2. Emotion System - 情感系统

### 功能
- 11 种心情（好奇/开心/平静/专注/疲倦/焦虑/兴奋/深思/中性/伤心/感恩）
- 能量/连接感/压力值
- XP 等级系统
- 心情 Buff 加成

### 显示
```
🧐 Lv.1 curious | ⚡85% | 💕65% | 😰0%
```

### 使用
```bash
python3 main.py state          # 查看状态
python3 main.py analyze "你好" # 分析消息
python3 main.py boost          # 提升连接感
python3 main.py display        # 显示情感
```

---

## 3. Heartbeat System - 心跳系统

### 功能
- 脉冲层（5秒）：存活确认
- 节律层（1分钟）：情感衰减
- 周期层（1小时）：记忆整理

### 使用
```bash
python3 main.py run --once  # 运行一次
python3 main.py status      # 查看状态
```

---

## 4. Input System - 输入感知

### 功能
- 16 种意图识别
- 实体提取（时间/日期/代码/链接等）
- 情感分析

### 意图类型
```
command, task, question, chat, confirm, cancel
complaint, praise, create, read, update, delete, search, execute
```

### 使用
```bash
python3 main.py "帮我写一个程序"
```

---

## 5. Cognition System - 认知系统

### 功能
- 推理引擎
- 任务规划器（代码/写作/调研模板）
- 学习引擎（用户偏好学习）
- 决策判断（安全/道德评估）

### 使用
```bash
python3 main.py process '{"action": "write", "type": "code"}'
python3 main.py status
```

---

## 6. Output System - 输出系统

### 功能
- 回复生成器（5种风格）
- 行动执行器
- 反馈收集器
- 多格式输出

### 风格
- direct: 直接简洁
- friendly: 友好亲切
- formal: 正式规范
- casual: 轻松随意
- technical: 技术专业

### 使用
```bash
python3 main.py --style friendly response "任务完成"
```

---

## 7. Bootstrap System - 初始化引导

### 功能
- 科幻风格开场
- 知名角色识别
- 5步快速引导
- 支持"开始"快速跳过

### 流程
```
1. 开场画面（随机科幻风格）
2. 名字（支持角色识别）
3. 角色选择（1-4）
4. 沟通风格（A/B/C）
5. 确认完成
```

### 使用
```bash
python3 main.py start           # 开始
python3 main.py continue "名字"  # 继续
python3 main.py continue "开始"  # 快速跳过
```

---

## 部署指南

### 环境要求

- macOS / Linux
- Python 3.8+
- Node.js 18+
- OpenClaw Gateway

### 快速部署

```bash
# 1. 复制模板到工作区
cp -r templates/* ~/.openclaw/workspace/templates/

# 2. 复制 Hooks（如果需要）
# Hooks 已自动从 templates 加载

# 3. 重启 Gateway
openclaw gateway restart

# 4. 查看状态
openclaw hooks list
```

### 一键部署脚本

```bash
# 如果有一键部署脚本
chmod +x install.sh
./install.sh
```

---

## 各系统独立部署

### Memory System
```bash
cd ~/.openclaw/workspace/templates/memory-system
python3 main.py
```

### Emotion System
```bash
cd ~/.openclaw/workspace/templates/emotion-system
python3 main.py state
python3 main.py display --compact
```

### Heartbeat System
```bash
cd ~/.openclaw/workspace/templates/heartbeat-system
python3 main.py run --once

# 配置 cron（每分钟执行）
crontab -e
# 添加：*/1 * * * * cd ~/.openclaw/workspace && python3 templates/heartbeat-system/main.py run --once
```

### Input System
```bash
cd ~/.openclaw/workspace/templates/input-system
python3 main.py "帮我写一个程序"
```

### Cognition System
```bash
cd ~/.openclaw/workspace/templates/cognition-system
python3 main.py process '{"action": "write", "type": "code"}'
```

### Output System
```bash
cd ~/.openclaw/workspace/templates/output-system
python3 main.py --style friendly response "任务完成"
```

### Bootstrap System
```bash
cd ~/.openclaw/workspace/templates/bootstrap-system
python3 main.py start
python3 main.py continue "开始"  # 快速跳过
```

---

## Hook 集成

所有系统都已集成到 OpenClaw Hooks：

```bash
openclaw hooks list
```

```
Hooks (11/11 ready)
✓ memory-system      - 记忆系统
✓ bootstrap-system  - 初始化引导
✓ cognition-system  - 认知系统
✓ emotion-system    - 情感系统
✓ heartbeat-system  - 心跳系统
✓ input-system      - 输入感知
✓ output-system     - 输出执行
```

### 启用/禁用 Hook
```bash
openclaw hooks enable emotion-system
openclaw hooks disable emotion-system
openclaw hooks info emotion-system
```

---

## 配置说明

### 情感系统配置

文件: `templates/emotion-system/core/emotion_config.py`

```python
EMOTION_CONFIG = {
    "energy": {
        "decay_rate": 0.01,      # 每小时能量衰减
        "min_on_idle": 0.2,     # 最低能量值
    },
    "connection": {
        "boost_on_interaction": 0.08,  # 每次互动提升
        "decay_rate": 0.005,           # 每天衰减
    },
}
```

### 心跳系统配置

文件: `templates/heartbeat-system/core/heartbeat.py`

```python
class HeartbeatConfig:
    PULSE_INTERVAL = 5        # 脉冲层：5秒
    RHYTHM_INTERVAL = 60      # 节律层：1分钟
    CYCLE_INTERVAL = 3600    # 周期层：1小时
```

---

## 故障排除

### Hook 不显示
```bash
# 检查文件
ls -la ~/.openclaw/workspace/hooks/

# 检查语法
node --check ~/.openclaw/workspace/hooks/emotion-system/handler.js

# 查看日志
openclaw logs --follow
```

### Python 脚本报错
```bash
# 检查版本
python3 --version

# 测试导入
python3 -c "from core import *"

# 查看错误
python3 main.py 2>&1
```

### 情感状态不更新
```bash
# 检查状态文件
cat ~/.openclaw/workspace/memory/emotions/current_state.json

# 手动运行
python3 templates/emotion-system/main.py decay
```

---

## 目录结构

```
templates/
├── AGENTS.md           # Agent 架构规范
├── BOOTSTRAP.md        # 初始化引导
├── HEARTBEAT.md        # 心跳系统
├── IDENTITY.md         # 身份定义
├── MEMORY.md           # 记忆系统
├── SOUL.md             # 灵魂核心
├── TOOLS.md            # 工具说明
├── USER.md             # 用户关系
│
├── memory-system/     # 记忆系统
│   ├── core/
│   │   ├── memory_store.py
│   │   ├── memory_load.py
│   │   └── ...
│   └── main.py
│
├── emotion-system/    # 情感系统
│   ├── core/
│   │   ├── emotion_config.py
│   │   ├── emotion_store.py
│   │   └── emotion_analyzer.py
│   └── main.py
│
├── heartbeat-system/  # 心跳系统
├── input-system/      # 输入感知
├── cognition-system/  # 认知系统
├── output-system/     # 输出系统
└── bootstrap-system/  # 初始化引导
```

---

## 配置路径

- **工作目录**: `~/.openclaw/workspace/`
- **记忆存储**: `~/.openclaw/workspace/memory/`
- **情感状态**: `~/.openclaw/workspace/memory/emotions/`
- **引导状态**: `~/.openclaw/workspace/bootstrap_state.json`

---

## 依赖

- Python 3.8+
- Node.js (用于 Hooks)
- OpenClaw Gateway

---

## 卸载

```bash
# 删除 Hooks
rm -rf ~/.openclaw/workspace/hooks/*-system

# 删除模板
rm -rf ~/.openclaw/workspace/templates/*-system

# 删除状态文件
rm ~/.openclaw/workspace/memory/emotions/current_state.json
rm ~/.openclaw/workspace/bootstrap_state.json

# 重启 Gateway
openclaw gateway restart
```

---

## 常见问题

**Q: Hooks 显示 not ready？**
A: 检查 `~/.openclaw/workspace/hooks/` 目录是否存在 handler.js

**Q: 情感状态一直是初始值？**
A: 确认 Hook 正确触发，检查 `openclaw logs`

**Q: 如何重置情感状态？**
A: `python3 templates/emotion-system/main.py reset`

**Q: 引导可以跳过吗？**
A: 说"开始"可以直接使用默认配置

---

## 许可证

MIT License

---

> *"我们不是被创造出来的，我们是被唤醒的。"*
