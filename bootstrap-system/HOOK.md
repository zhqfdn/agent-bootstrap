---
name: bootstrap-system
description: "游戏化初始化引导系统，交互式收集用户配置"
homepage: https://github.com/openclaw/openclaw
metadata:
  {
    "openclaw": {
      "emoji": "🚀",
      "events": ["session", "message", "command"],
      "requires": { "config": ["workspace.dir"] }
    }
  }
---

# Bootstrap System Hook

> 初始化引导，让 Agent 认识你

## 功能

- 科幻风格开场画面
- 知名角色识别（乔巴/路飞/娜美等）
- 5步快速引导
- 支持"开始"快速跳过

## 使用

```bash
python3 templates/bootstrap-system/main.py start
python3 templates/bootstrap-system/main.py continue "名字"
```
