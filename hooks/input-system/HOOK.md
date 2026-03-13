---
name: input-system
description: "输入感知系统，理解用户意图、提取实体、分析情感"
homepage: https://github.com/openclaw/openclaw
metadata:
  {
    "openclaw": {
      "emoji": "🎯",
      "events": ["message", "command"],
      "requires": { "config": ["workspace.dir"] },
      "install": [{ "id": "workspace", "kind": "workspace", "label": "User workspace" }]
    }
  }
---

# Input System Hook

> 理解用户输入的"大脑"

## 概述

输入感知系统负责理解用户的消息，识别意图、提取实体、分析情感。

## 功能

### 意图识别
识别用户想要做什么：

| 意图 | 说明 | 示例 |
|------|------|------|
| command | 命令 | /help |
| task | 任务 | 帮我写个程序 |
| question | 提问 | 怎么安装？ |
| chat | 闲聊 | 好啊 |
| confirm | 确认 | 好的 |
| cancel | 取消 | 算了 |
| complaint | 抱怨 | 不好用 |
| praise | 表扬 | 很棒 |

### 实体提取
从文本中提取关键信息：

- 时间 (time)
- 日期 (date)
- 数字 (number)
- 代码 (code)
- 链接 (url)
- 文件 (file)

### 情感分析
分析用户情绪倾向

## 使用方法

```bash
# 分析文本
python3 templates/input-system/main.py "帮我写一个Hello World"

# 交互模式
python3 templates/input-system/main.py -i
```

## 输出格式

```json
{
  "type": "task",
  "confidence": 0.65,
  "action": "create",
  "entities": [
    {"type": "code", "value": "Hello World"}
  ],
  "slots": {"keywords": ["写", "程序"]}
}
```

## 依赖

- Python 3.8+
