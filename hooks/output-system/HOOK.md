---
name: output-system
description: "输出执行系统，语言生成、行动执行、反馈收集、多模态输出"
homepage: https://github.com/openclaw/openclaw
metadata:
  {
    "openclaw": {
      "emoji": "📤",
      "events": ["agent", "lifecycle", "command"],
      "requires": { "config": ["workspace.dir"] },
      "install": [{ "id": "workspace", "kind": "workspace", "label": "User workspace" }]
    }
  }
---

# Output System Hook

> 输出执行的"嘴巴"

## 概述

输出系统负责生成回复、执行行动、收集反馈。

## 功能

### 1. 回复生成器
不同风格的回复模板：
- direct: 直接简洁
- friendly: 友好亲切
- formal: 正式规范
- casual: 轻松随意
- technical: 技术专业

### 2. 行动执行器
执行各种行动：
- file.write / file.read / file.delete
- shell.run
- http.request
- search.web

### 3. 反馈收集器
- 确认问题
- 澄清问题
- 信息缺失提示

### 4. 格式化器
- 代码块
- 列表
- 表格

## 使用方法

```bash
# 生成回复
python3 templates/output-system/main.py --style friendly response "任务完成"

# 执行行动
python3 templates/output-system/main.py action file.read '{"path": "/tmp/test.txt"}'

# 格式化列表
python3 templates/output-system/main.py list "a,b,c" --numbered

# 查看状态
python3 templates/output-system/main.py status
```

## 工作流程

```
INPUT(意图识别) → COGNITION(推理规划) → OUTPUT(执行输出)
                                              ↓
                                    回复生成 + 行动执行
                                              ↓
                                    附加情感状态显示
```

## 依赖

- Python 3.8+
