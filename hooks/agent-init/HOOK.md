---
name: agent-init
description: "Agent 初始化系统：监听 command:new 和 command:reset 事件，检测并复制模板到 Agent workspace"
homepage: https://github.com/qcluffy/agent-bootstrap
metadata:
  openclaw:
    emoji: "🚀"
    events: ["command:new", "command:reset"]
    requires:
      config: ["workspace.dir"]
    install:
      - id: "agent-bootstrap"
        kind: "plugin"
        label: "Agent Bootstrap Plugin"
---

# Agent Init Hook

当用户执行 `/new` 或 `/reset` 命令时，此 Hook 会：

1. **检测事件类型**
   - `command:new` - 新建会话
   - `command:reset` - 重置会话

2. **处理逻辑**
   - 检查 Agent workspace 是否存在必要模板文件
   - 如不存在，从插件模板目录复制
   - 对于 reset 事件，强制覆盖所有模板

3. **模板文件**
   - AGENTS.md
   - SOUL.md
   - MEMORY.md
   - IDENTITY.md
   - USER.md
   - TOOLS.md
   - BOOTSTRAP.md
   - HEARTBEAT.md
