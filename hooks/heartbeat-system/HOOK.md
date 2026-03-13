---
name: heartbeat-system
description: "心跳系统，定时执行情感衰减、状态保存、垃圾清理"
homepage: https://github.com/openclaw/openclaw
metadata:
  {
    "openclaw": {
      "emoji": "💓",
      "events": ["heartbeat", "pulse", "command"],
      "requires": { "config": ["workspace.dir"] },
      "install": [{ "id": "workspace", "kind": "workspace", "label": "User workspace" }]
    }
  }
---

# Heartbeat System Hook

> 让 Agent 拥有"心跳"，定时执行维护任务

## 概述

心跳系统模拟 Agent 的生命体征，定时执行维护任务。

## 心跳层次

| 层次 | 频率 | 任务 |
|------|------|------|
| 脉冲层 | 每5秒 | 存活确认 |
| 节律层 | 每分钟 | 情感衰减、状态保存 |
| 周期层 | 每小时 | 记忆整理、深度清理 |

## 功能

1. **情感衰减** - 定时调用情感系统，降低能量和连接感
2. **状态保存** - 定期保存各系统状态
3. **垃圾清理** - 清理过期临时文件
4. **存活确认** - 确认系统正常运行

## 使用方法

```bash
# 查看状态
python3 templates/heartbeat-system/main.py status

# 运行一次
python3 templates/heartbeat-system/main.py run --once

# 守护进程模式
python3 templates/heartbeat-system/main.py run
```

## 集成方式

推荐使用 cron 每分钟调用：

```bash
*/1 * * * * cd ~/.openclaw/workspace && python3 templates/heartbeat-system/main.py run --once
```

## 依赖

- Python 3.8+
- emotion-system（用于情感衰减）
