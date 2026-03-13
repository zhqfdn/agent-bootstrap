---
name: bootstrap-system
description: "初始化引导系统，交互式收集用户配置、塑造Agent人格"
homepage: https://github.com/openclaw/openclaw
metadata:
  {
    "openclaw": {
      "emoji": "🚀",
      "events": ["session", "message", "command"],
      "requires": { "config": ["workspace.dir"] },
      "install": [{ "id": "workspace", "kind": "workspace", "label": "User workspace" }]
    }
  }
---

# Bootstrap System Hook

> 初始化引导，让 Agent 认识你

## 概述

Bootstrap 系统负责新用户的交互式初始化引导，收集用户配置并塑造 Agent 人格。

## 功能

### 1. 开场画面
每次随机生成科幻风格的开场画面：
- 🌟 星门开启，意识已连接
- 🌌 量子通道已建立
- 🔮 意识扫描完成
- 🌀 虫洞已稳定
- 💫 系统载入中

### 2. 引导步骤
1. **序章** - 登录科幻世界
2. **命名** - 给 Agent 取名
3. **角色定位** - 确定 Agent 角色
4. **使用场景** - 了解主要用途
5. **偏好设置** - 沟通风格、问题处理等
6. **确认** - 确认设置
7. **完成** - 初始化完成

### 3. 自动写入
完成后自动写入配置文件：
- IDENTITY.md - Agent 身份
- USER.md - 用户配置

## 使用方法

```bash
# 开始引导
python3 templates/bootstrap-system/main.py start

# 查看当前步骤
python3 templates/bootstrap-system/main.py step

# 提交输入
python3 templates/bootstrap-system/main.py submit "我的名字叫路飞"

# 查看状态
python3 templates/bootstrap-system/main.py status

# 重置
python3 templates/bootstrap-system/main.py reset
```

## 触发条件

- 用户首次会话（检测 bootstrap 状态）
- 用户发送 /bootstrap 或 /引导 命令

## 依赖

- Python 3.8+
