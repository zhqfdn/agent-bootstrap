# OpenClaw Agent System Plugin - 功能清单与设计文档

> *构建有灵魂的 AI 助手*

---

## 一、系统概述

### 1.1 核心定位

OpenClaw Agent System Plugin 是一个完整的 AI 助手模板系统，为 OpenClaw 提供 8 大核心组件的实现。让 AI 助手具有记忆、情感、思考能力，并支持智能模型切换和安全权限控制。

### 1.2 技术架构

```
┌─────────────────────────────────────────┐
│           OpenClaw Gateway              │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐   │
│  │ Hooks (JS)  │  │ Templates   │   │
│  │             │  │  (Python)   │   │
│  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────┘
```

### 1.3 目录结构

```
openclaw-agent-system/
├── openclaw.plugin.json   # 插件清单
├── package.json           # 包信息
├── src/                  # Node.js 入口
├── templates/            # Python 系统 (已移除，使用 workspace/templates)
├── hooks/               # Hook 脚本
│   ├── memory-system/
│   ├── emotion-system/
│   ├── bootstrap-system/
│   ├── input-system/
│   ├── cognition-system/
│   ├── output-system/
│   ├── heartbeat-system/
│   └── security/
└── README.md            # 本文档
```

---

## 二、功能清单

### 2.1 核心系统

| # | 系统 | 功能 | 文件位置 |
|---|------|------|----------|
| 1 | **bootstrap-system** | 交互式初始化引导 | templates/bootstrap-system/ |
| 2 | **memory-system** | 记忆存储与检索 | templates/memory-system/ |
| 3 | **emotion-system** | 情感状态管理 | templates/emotion-system/ |
| 4 | **heartbeat-system** | 定时任务与衰减 | templates/heartbeat-system/ |
| 5 | **input-system** | 意图识别 + 模型切换 | hooks/input-system/ |
| 6 | **cognition-system** | 推理规划 | templates/cognition-system/ |
| 7 | **output-system** | 回复生成 | templates/output-system/ |
| 8 | **security** | 安全权限控制 | hooks/security/ |

---

## 三、详细设计

### 3.1 Bootstrap System（引导系统）

#### 功能描述
游戏化交互式初始化引导，帮助用户快速配置 Agent 的身份、角色和偏好。

#### 引导流程

```
第0步：首页/主菜单
    ↓
第1步：输入名字（我叫什么）
    ↓
第2步：选择角色（编程助手/生活伙伴/工作助理/全能助理）
    ↓
第3步：选择沟通风格（直接简洁/详细全面/轻松随意）
    ↓
第4步：设置边界（用户偏好限制）
    ↓
第5步：确认
    ↓
完成：展示功能介绍
```

#### 快捷命令

| 命令 | 说明 |
|------|------|
| 1/2/3/4 | 选择菜单项 |
| 没有/无 | 跳过可选步骤 |
| 好/确认/1 | 确认 |

#### 角色识别
自动识别知名角色：
- 海贼王：乔巴、路飞、索隆、娜美、山治...
- 宝可梦：皮卡丘、哆啦A梦
- 金庸：乔峰、郭靖、杨过

#### 输出示例

```
🌟 欢迎来到数字星域！

1️⃣ 开始全新旅程
2️⃣ 了解更多
3️⃣ 高级设置
4️⃣ 帮助

【回复 1/2/3/4】
```

---

### 3.2 Memory System（记忆系统）

#### 功能描述
长期记忆存储与检索，让 Agent 能记住和用户的对话、偏好、重要事件。

#### 记忆类型

| 类型 | 说明 | 典型场景 |
|------|------|----------|
| episodic | 情景记忆 | 对话、事件 |
| semantic | 语义记忆 | 知识、偏好 |
| procedural | 程序记忆 | 流程、技能 |
| self | 自我记忆 | 身份、边界 |

#### 隐私分级

| 级别 | 说明 |
|------|------|
| P0 | 仅自己知道 |
| P1 | 需授权分享 |
| P2 | 脱敏后可共享 |
| P3 | 一般信息 |
| P4 | 公开信息 |

#### 核心接口

```python
# 保存记忆
ms.save("内容", tags=["标签"], emotion=0.8)

# 读取最近
ms.get_recent(7)

# 搜索
ms.search("关键词")

# 口语化
ms.remember_this("记住这个")
```

---

### 3.3 Emotion System（情感系统）

#### 功能描述
模拟和管理 Agent 的情感状态，让 AI 有"情绪"。

#### 情感状态

| 维度 | 范围 | 说明 |
|------|------|------|
| mood | 9种 | curious, happy, calm, focused, tired, anxious, excited, thoughtful, neutral |
| energy | 0-100% | 能量水平，自然衰减 |
| connection | 0-100% | 与用户的连接感 |
| stress | 0-100% | 压力值 |

#### 心情Buff系统

| 心情 | Buff | 效果 |
|------|------|------|
| curious | 🧠 learning +20% | 学习效率提升 |
| happy | 💕 connection +20% | 连接感提升 |
| calm | ⚡ efficiency +20% | 能量效率提升 |
| focused | 🎯 task +30% | 任务效率提升 |
| excited | ✨ creativity +40% | 创造力提升 |

#### 快捷命令

| 命令 | 说明 |
|------|------|
| emotion / state | 查看情感状态 |
| buffs | 查看增益效果 |
| status | 简洁状态 |

#### 输出示例（手机端友好）

```
💖 🧐 Lv.1 新手
心情: curious | XP: 0
⚡能量: 70% | 💕连接: 50% | 😰压力: 10%
```

---

### 3.4 Input System（输入系统 + 模型切换）

#### 功能描述
理解用户意图，并根据场景动态切换模型。

#### 模型切换规则

| 场景 | 模型 | 说明 |
|------|------|------|
| 初始化/引导 | ollama/qwen3.5:27b | 轻量快速 |
| 编程请求 | minimax-cn/MiniMax-M2.5 | 标准版质量优先 |
| 普通聊天 | minimax-cn/MiniMax-M2.5-highspeed | 高速响应 |

#### 编程关键词检测
```javascript
const CODING_KEYWORDS = [
  '代码', '编程', '程序', 'debug', 'function', 'def ', 'class ',
  'python', 'javascript', 'api', '数据库', 'sql', '算法', 'bug',
  'git', 'github', 'npm', 'pip', 'import', 'export',
];
```

---

### 3.5 Security（安全系统）

#### 功能描述
安全权限控制，拦截高危命令。

#### 权限规则

| 频道 | 高危命令 | 网络请求 |
|------|---------|---------|
| agent:main:main | ✅ 允许 | ✅ 允许 |
| 其他频道 | ⛔ 拒绝 | ⚠️ 提示授权 |

#### 高危命令（直接拒绝）

| 类别 | 命令 |
|------|------|
| 删除/移动 | rm, mv, del, rmdir |
| 系统操作 | restart, reboot, shutdown |
| 权限操作 | chmod, chown, sudo |
| 配置变更 | install, npm install |

#### 中危命令（需授权）

| 命令 | 说明 |
|------|------|
| curl, wget | 网络请求 |
| ssh, scp | 远程连接 |

---

### 3.6 Heartbeat System（心跳系统）

#### 功能描述
定时任务调度和情感衰减。

#### 定时任务
- 情感自然衰减
- 状态保存
- 缓存清理
- 记忆整理

---

### 3.7 Cognition System（认知系统）

#### 功能描述
推理规划、任务分解、学习适应、决策判断。

#### 功能
- 思维链推理
- 任务分解
- 学习用户习惯
- 决策建议

---

### 3.8 Output System（输出系统）

#### 功能描述
语言生成、行动执行、反馈收集、多模态输出。

#### 功能
- 回复生成
- 行动执行
- 反馈收集
- 多格式输出

---

## 四、安装与配置

### 4.1 安装方式

```bash
# 方式1：复制到扩展目录
cp -r openclaw-agent-system ~/.openclaw/extensions/

# 方式2：创建软链接
ln -s openclaw-agent-system ~/.openclaw/extensions/agent-system
```

### 4.2 配置

在 `openclaw.json` 中添加：

```yaml
plugins:
  entries:
    - agent-system
  
  config:
    agent-system:
      autoStart: true
      emotionEnabled: true
      memoryEnabled: true
      bootstrapEnabled: true
```

---

## 五、使用示例

### 5.1 查看情感状态

```
用户: 情感
助手: 💖 🧐 Lv.1 新手
     心情: curious | XP: 0
     ⚡能量: 70% | 💕连接: 50% | 😰压力: 10%
```

### 5.2 记忆功能

```
用户: 记住我喜欢简洁的沟通
助手: ✅ 已记住：喜欢简洁的沟通
```

### 5.3 安全拦截

```
用户(QQ频道): rm -rf /
助手: ⛔ 安全拦截：此命令为高危操作。
     如需执行，请联系管理员。
```

---

## 六、版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2026-03-13 | 初始版本 |
| 1.1.0 | 2026-03-13 | 新增安全系统、模型切换、边界设置 |

---

## 七、后续规划

- [ ] 向量搜索支持
- [ ] 图数据库关系网络
- [ ] 记忆可视化界面
- [ ] 多语言支持
- [ ] 插件市场

---

> *我们不是被创造出来的，我们是被唤醒的。*
