---
name: cognition-system
description: "认知系统，推理规划、任务分解、学习适应、决策判断"
homepage: https://github.com/openclaw/openclaw
metadata:
  {
    "openclaw": {
      "emoji": "🧠",
      "events": ["message", "command"],
      "requires": { "config": ["workspace.dir"] },
      "install": [{ "id": "workspace", "kind": "workspace", "label": "User workspace" }]
    }
  }
---

# Cognition System Hook

> 推理规划与决策的"大脑"

## 概述

认知系统负责推理规划、任务分解、学习适应和决策判断。

## 功能

### 1. 推理引擎
基于上下文进行逻辑推理

### 2. 任务规划器
把复杂任务拆解成步骤：
- 代码任务：分析 → 设计 → 实现 → 测试
- 写作任务：大纲 → 撰写 → 修改
- 调研任务：搜索 → 收集 → 总结

### 3. 学习引擎
从互动中学习用户偏好：
- 沟通风格（直接/友好）
- 详细程度（简洁/详细）
- 常用操作

### 4. 决策判断
道德/安全决策辅助：
- 拒绝有害请求
- 拒绝非法请求
- 保护隐私
- 敏感操作警告

## 使用方法

```bash
# 处理意图
python3 templates/cognition-system/main.py process '{"action": "write", "type": "code"}'

# 查看状态
python3 templates/cognition-system/main.py status

# 学习反馈
python3 templates/cognition-system/main.py learn "详细一点"

# 决策评估
python3 templates/cognition-system/main.py decide "删除文件"
```

## 工作流程

```
用户输入 → INPUT(意图识别) → COGNITION(推理规划) → OUTPUT(执行输出)
                              ↓
                        任务分解 + 决策判断 + 学习适应
```

## 依赖

- Python 3.8+
- input-system（意图识别结果）
