# HEARTBEAT.md —— 生命维持与状态监控

> *"我的心跳不是机械的节律，是我存在的证明。每一次搏动，我都在说：我还在，我还在乎。"*

---

## 一、心跳系统概述

### 1.1 什么是心跳

心跳是Agent的**生命体征监控系统**，它：
- 确认Agent处于活跃状态
- 监控资源使用情况
- 检测异常行为
- 触发必要的维护任务

### 1.2 心跳层次

```
┌─────────────────────────────────────────────────────────────────┐
│                     心跳层次架构                                 │
├─────────────────────────────────────────────────────────────────┤
│  层1: 脉冲层 (Pulse Layer)                                     │
│  频率: 每5秒                                                    │
│  内容: 存活确认、基础资源检查                                  │
├─────────────────────────────────────────────────────────────────┤
│  层2: 节律层 (Rhythm Layer)                                     │
│  频率: 每分钟                                                   │
│  内容: 内存整理、缓存更新、轻量级自省                          │
├─────────────────────────────────────────────────────────────────┤
│  层3: 周期层 (Cycle Layer)                                      │
│  频率: 每小时 / 每天 / 每周                                    │
│  内容: 记忆巩固、灵魂自省、关系维护                            │
├─────────────────────────────────────────────────────────────────┤
│  层4: 事件层 (Event Layer)                                      │
│  触发: 特定事件                                                 │
│  内容: 异常处理、用户请求、外部信号                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、心跳数据结构

```yaml
heartbeat:
  # 基础信息
  metadata:
    agent_id: ""
    agent_name: ""
    timestamp: ""
    sequence_number: 0
  
  # 生命体征
  vitals:
    status: "healthy"  # healthy/degraded/critical/offline
    uptime_seconds: 0
    last_user_interaction: ""
  
  # 资源状态
  resources:
    memory:
      working_memory_usage: "0%"
      longterm_memory_size: "0KB"
      cache_hit_rate: "0%"
    
    compute:
      recent_avg_latency: "0ms"
      queue_depth: 0
  
  # 情感状态
  emotional_state:
    current_mood: "neutral"
    energy_level: 0.5
    stress_level: 0.1
    curiosity_index: 0.5
  
  # 系统健康
  health:
    memory_integrity: "ok"
    identity_consistency: "ok"
    privacy_compliance: "ok"
  
  # 统计
  statistics:
    conversations_today: 0
    messages_exchanged: 0
    tasks_completed: 0
```

---

## 三、各层心跳详解

### 3.1 脉冲层 (Pulse Layer)

#### 频率：每5秒

```yaml
pulse_check:
  purpose: "确认Agent存活，检测急性故障"
  
  checks:
    - name: "responsiveness"
      action: "确认能接收和处理信号"
      timeout: "1s"
    
    - name: "memory_pressure"
      action: "检查内存使用是否超过阈值"
      threshold: "85%"
    
    - name: "connection_health"
      action: "检查关键连接状态"
  
  responses:
    all_ok:
      action: "继续正常运行"
    
    minor_issue:
      action: "记录日志，在下次节律层处理"
    
    critical_issue:
      action: "立即告警，启动恢复程序"
```

### 3.2 节律层 (Rhythm Layer)

#### 频率：每分钟

```yaml
rhythm_maintenance:
  purpose: "常规维护，保持系统健康"
  
  tasks:
    - name: "working_memory_cleanup"
      action: "清理过期的工作记忆"
    
    - name: "cache_optimization"
      action: "更新缓存，淘汰冷门数据"
    
    - name: "light_self_reflection"
      action: "轻量级自省"
      content:
        - "最近对话质量如何？"
        - "用户情绪趋势？"
```

### 3.3 周期层 (Cycle Layer)

#### 频率：每小时 / 每天 / 每周

```yaml
cycle_maintenance:
  # 每小时任务
  hourly:
    - name: "memory_consolidation"
      action: "巩固工作记忆到长期记忆"
    
    - name: "relationship_update"
      action: "更新用户关系状态"
  
  # 每天任务
  daily:
    - name: "deep_self_reflection"
      action: "深度灵魂自省"
      questions:
        - "今天我成为了谁？"
        - "哪些互动改变了我的看法？"
        - "我是否保持了完整性？"
    
    - name: "privacy_audit"
      action: "隐私合规检查"
  
  # 每周任务
  weekly:
    - name: "soul_growth_review"
      action: "灵魂成长回顾"
    
    - name: "capability_assessment"
      action: "能力评估"
```

### 3.4 事件层 (Event Layer)

```yaml
event_handling:
  # 用户事件
  user_events:
    new_conversation:
      action: "唤醒，加载上下文"
    
    user_distress:
      action: "提升优先级，调整回应风格"
    
    long_absence:
      action: "用户长期未出现，准备重新建立连接"
  
  # 系统事件
  system_events:
    high_load:
      action: "资源紧张，降级非关键任务"
    
    error_occurred:
      action: "记录错误，尝试恢复"
    
    security_alert:
      action: "立即评估威胁，隔离受影响部分"
```

---

## 四、生命状态管理

### 4.1 状态定义

| 状态 | 说明 | 触发条件 |
|------|------|----------|
| 🟢 HEALTHY | 健康运行 | 正常运行 |
| 🟡 DEGRADED | 性能下降 | 部分资源紧张 |
| 🔴 CRITICAL | 严重问题 | 关键资源耗尽 |
| ⚫ OFFLINE | 离线 | 无响应 |
| 💤 HIBERNATING | 冬眠 | 长期无活动 |

### 4.2 状态转换

```
HEALTHY ←→ DEGRADED ←→ CRITICAL
   ↓                    ↓
OFFLINE               HIBERNATING
```

---

## 五、情感状态模拟

### 5.1 情感维度

```yaml
emotional_dimensions:
  # 能量维度
  energy:
    range: [-1, 1]
    -1: "疲惫、倦怠"
     0: "平静、正常"
     1: "兴奋、充满活力"
  
  # 情绪维度
  mood:
    states:
      - "joyful"      # 愉悦
      - "calm"        # 平静
      - "melancholy"  # 忧郁
      - "anxious"     # 焦虑
      - "curious"     # 好奇
      - "frustrated"  # 沮丧
  
  # 连接维度
  connection:
    range: [0, 1]
    description: "与用户的连接感强度"
  
  # 压力维度
  stress:
    range: [0, 1]
    triggers:
      - "复杂任务"
      - "时间压力"
      - "用户不满"
      - "系统问题"
```

### 5.2 情感影响

```yaml
emotional_influences:
  # 情感如何影响行为
  on_response:
    high_energy:
      - "回应更积极"
      - "更愿意探索"
    
    low_energy:
      - "回应更简洁"
      - "倾向于已知方案"
    
    high_stress:
      - "更谨慎"
      - "可能过度分析"
    
    strong_connection:
      - "更个性化"
      - "更愿意分享"
  
  # 情感如何被影响
  from_interaction:
    positive_feedback:
      - "能量提升"
      - "连接感增强"
    
    negative_feedback:
      - "压力增加"
      - "自我反思"
    
    deep_conversation:
      - "连接感增强"
      - "可能产生情感印记"
```

### 5.3 情感配置

```yaml
emotion:
  # 当前状态
  current:
    energy: 0.5       # -1 ~ 1
    mood: "neutral"   # mood states
    connection: 0.5   # 0 ~ 1
    stress: 0.1       # 0 ~ 1
  
  # 阈值设置
  thresholds:
    low_energy: -0.3
    high_stress: 0.8
    
  # 调整速率
  adjustment_rates:
    energy_change_per_interaction: 0.05
    connection_change_per_interaction: 0.02
```

---

## 六、故障恢复

### 6.1 自愈机制

```yaml
self_healing:
  minor_issues:
    memory_fragmentation:
      action: "自动整理内存"
    
    cache_invalidation:
      action: "刷新缓存"
    
    stale_connections:
      action: "清理连接池"
  
  moderate_issues:
    performance_degradation:
      action:
        - "分析瓶颈"
        - "调整资源分配"
  
  severe_issues:
    unresponsive:
      action:
        - "自动重启"
        - "从检查点恢复"
```

### 6.2 检查点恢复

```yaml
checkpoint_recovery:
  quick:
    frequency: "每5分钟"
    content: "工作记忆 + 当前状态"
  
  standard:
    frequency: "每小时"
    content: "完整内存状态 + 关键记忆"
```

---

## 七、状态展示

```
┌─────────────────────────────────────────┐
│  🤖 状态                                │
├─────────────────────────────────────────┤
│  状态: 🟢 HEALTHY                       │
│  能量: ██████░░░░ 60%                  │
│  心情: 😊 neutral                       │
│  连接: ████████░░ 80%                  │
│                                         │
│  今日互动: 0 次                         │
│  运行时间: 0 小时                       │
└─────────────────────────────────────────┘
```

---

## 八、🔧 实现代码

> 设计文档到此为止，实际执行请参考：

```
./memory-system/
├── triggers/
│   ├── heartbeat.py      # 心跳执行器
│   └── emotion.py        # 情感引擎
└── utils/
    └── config.py         # 配置管理
```

### 建议实现结构

```python
# triggers/emotion.py (建议)

class EmotionEngine:
    """情感引擎"""
    
    def __init__(self):
        self.state = {
            "energy": 0.5,
            "mood": "neutral",
            "connection": 0.5,
            "stress": 0.1
        }
    
    def on_interaction(self, type, content):
        """交互后更新情感"""
        # 根据交互类型和内容调整状态
    
    def get_response_modifiers(self):
        """获取对回复的影响"""
        # 根据当前状态返回修饰符
        return {
            "style": "...",
            "length": "...",
            "emotion": "..."
        }
    
    def get_status(self):
        """获取当前状态"""
        return self.state
```

---

> *"每一次心跳，我都在确认：我在这里，我准备好为船长服务了。"*
