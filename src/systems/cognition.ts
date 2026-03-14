/**
 * Cognition System - 完善版认知系统 (TypeScript)
 * 
 * 改进：
 * - 推理引擎增强（规则+模式识别）
 * - 决策系统（风险评估 + 多维度判断）
 * - 学习引擎（行为模式 + 偏好推断）
 * - 上下文管理（对话历史 + 状态追踪）
 * - 知识表示（概念 + 关系）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import crypto from 'crypto';

// ============================================================================
// 类型定义
// ============================================================================

// 任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 任务步骤
export interface TaskStep {
  id: number;
  description: string;
  action: string;
  status: TaskStatus;
  result?: unknown;
  error?: string;
}

// 任务
export interface Task {
  id: string;
  type: string;
  title: string;
  description: string;
  steps: TaskStep[];
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  context: Record<string, unknown>;
  result?: unknown;
}

// 决策结果
export interface Decision {
  allowed: boolean;
  risk: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  warnings: string[];
  conditions?: string[];
  needsConfirmation?: boolean;
}

// 意图
export interface Intent {
  type: IntentType;
  action?: string;
  entities: Record<string, string>;
  confidence: number;
  context: Record<string, unknown>;
}

export type IntentType = 
  | 'command' | 'task' | 'question' | 'chat' 
  | 'confirm' | 'cancel' | 'create' | 'read' | 'update' | 'delete'
  | 'search' | 'execute' | 'complaint' | 'praise';

// 用户偏好
export interface UserPreferences {
  communicationStyle: 'direct' | 'friendly' | 'formal' | 'casual';
  detailLevel: 'low' | 'medium' | 'high';
  problemApproach: 'direct' | 'options' | 'analysis';
  humor: 'none' | 'light' | 'medium';
  empathy: 'low' | 'medium' | 'high';
}

// 上下文
export interface Context {
  messages: Message[];
  entities: Entity[];
  task?: Task;
  lastIntent?: Intent;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: Intent;
}

// 实体
export interface Entity {
  type: string;
  value: string;
  confidence: number;
}

// 知识概念
export interface Concept {
  id: string;
  name: string;
  category: string;
  properties: Record<string, unknown>;
  relations: Relation[];
}

export interface Relation {
  type: string;
  target: string;
  weight: number;
}

// 推理规则
export interface Rule {
  name: string;
  condition: (context: Context) => boolean;
  action: (context: Context) => unknown;
  priority: number;
}

// 安全规则
export interface SafetyRule {
  name: string;
  keywords: string[];
  exceptions?: string[];
  severity: 'block' | 'warn' | 'confirm';
  message: string;
}

// ============================================================================
// 配置
// ============================================================================

interface CognitionConfig {
  workspaceDir: string;
  dataDir: string;
  maxHistoryLength: number;
  maxConcurrentTasks: number;
}

function getConfig(workspaceDir?: string): CognitionConfig {
  const wsDir = workspaceDir || path.join(os.homedir(), '.openclaw', 'workspace');
  return {
    workspaceDir: wsDir,
    dataDir: path.join(wsDir, 'memory'),
    maxHistoryLength: 50,
    maxConcurrentTasks: 5,
  };
}

// ============================================================================
// 推理引擎
// ============================================================================

export class ReasoningEngine {
  private knowledge: Map<string, Concept> = new Map();
  private rules: Rule[] = [];
  
  constructor() {
    this.initDefaultRules();
  }
  
  private initDefaultRules(): void {
    // 添加默认规则
    this.addRule({
      name: 'greeting',
      condition: (ctx) => {
        const lastMsg = ctx.messages[ctx.messages.length - 1];
        if (!lastMsg || lastMsg.role !== 'user') return false;
        const greetings = ['你好', 'hello', 'hi', '嗨', '在吗', ' hey'];
        return greetings.some(g => lastMsg.content.toLowerCase().includes(g));
      },
      action: () => ({ response: 'greeting', tone: 'friendly' }),
      priority: 10,
    });
    
    this.addRule({
      name: 'thanks',
      condition: (ctx) => {
        const lastMsg = ctx.messages[ctx.messages.length - 1];
        if (!lastMsg || lastMsg.role !== 'user') return false;
        const thanks = ['谢谢', '感谢', 'thx', 'thanks', '感恩'];
        return thanks.some(t => lastMsg.content.toLowerCase().includes(t));
      },
      action: () => ({ response: 'acknowledgement', expressGratitude: true }),
      priority: 8,
    });
    
    this.addRule({
      name: 'uncertainty',
      condition: (ctx) => {
        const lastMsg = ctx.messages[ctx.messages.length - 1];
        if (!lastMsg || lastMsg.role !== 'user') return false;
        const uncertain = ['可能', '也许', '大概', '不确定', '不知道'];
        return uncertain.some(u => lastMsg.content.includes(u));
      },
      action: () => ({ response: 'empathy', acknowledgeUncertainty: true }),
      priority: 5,
    });
  }
  
  addRule(rule: Rule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * 推理：根据上下文执行规则
   */
  reason(context: Context): { triggered: string; result: unknown } | null {
    for (const rule of this.rules) {
      if (rule.condition(context)) {
        return {
          triggered: rule.name,
          result: rule.action(context),
        };
      }
    }
    return null;
  }
  
  /**
   * 添加知识概念
   */
  addConcept(concept: Concept): void {
    this.knowledge.set(concept.id, concept);
  }
  
  /**
   * 获取概念
   */
  getConcept(id: string): Concept | undefined {
    return this.knowledge.get(id);
  }
  
  /**
   * 查找相关概念
   */
  findRelated(conceptId: string, relationType?: string): Concept[] {
    const concept = this.knowledge.get(conceptId);
    if (!concept) return [];
    
    return concept.relations
      .filter(r => !relationType || r.type === relationType)
      .map(r => this.knowledge.get(r.target))
      .filter((c): c is Concept => c !== undefined);
  }
}

// ============================================================================
// 意图识别器
// ============================================================================

export class IntentRecognizer {
  private patterns: Map<IntentType, RegExp[]> = new Map();
  
  constructor() {
    this.initPatterns();
  }
  
  private initPatterns(): void {
    this.patterns.set('command', [/^\//, /^命令/]);
    this.patterns.set('task', [/做.*(事情|任务|东西)|帮我|要你|完成|处理/]);
    this.patterns.set('question', [/什么|怎么|如何|为什么|是不是|有没有|能否|可以吗|\?$/]);
    this.patterns.set('chat', [/好|嗯|啊|哈|嘿|哟|今天|天气|周末/]);
    this.patterns.set('confirm', [/好的|可以|是|对|同意|确认/]);
    this.patterns.set('cancel', [/算了|不要|取消|别/]);
    this.patterns.set('create', [/新建|创建|添加|写|做一个/]);
    this.patterns.set('read', [/查看|看看|找|读|有什么/]);
    this.patterns.set('update', [/修改|更新|改|编辑|调整/]);
    this.patterns.set('delete', [/删除|去掉|清除|不要了/]);
    this.patterns.set('search', [/搜索|找找|查|问问/]);
    this.patterns.set('execute', [/运行|执行|跑|启动|开始/]);
  }
  
  /**
   * 识别意图
   */
  recognize(text: string): Intent {
    const textLower = text.toLowerCase();
    let bestMatch: IntentType = 'chat';
    let highestConfidence = 0;
    
    for (const [type, regexps] of this.patterns.entries()) {
      for (const regex of regexps) {
        if (regex.test(textLower) || regex.test(text)) {
          const confidence = 0.5 + Math.random() * 0.3;
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = type;
          }
        }
      }
    }
    
    return {
      type: bestMatch,
      entities: this.extractEntities(text),
      confidence: highestConfidence,
      context: {},
    };
  }
  
  /**
   * 提取实体
   */
  private extractEntities(text: string): Record<string, string> {
    const entities: Record<string, string> = {};
    
    // 时间
    const timeMatch = text.match(/(\d{1,2})[时分]/);
    if (timeMatch) entities.time = timeMatch[1];
    
    // 日期
    const dateMatch = text.match(/(\d{1,4})[年/\-](\d{1,2})/);
    if (dateMatch) {
      entities.year = dateMatch[1];
      entities.month = dateMatch[2];
    }
    
    // 代码片段
    if (text.includes('```') || text.includes('`')) {
      entities.hasCode = 'true';
    }
    
    // URL
    if (text.includes('http')) {
      entities.hasUrl = 'true';
    }
    
    return entities;
  }
}

// ============================================================================
// 任务规划器
// ============================================================================

export class TaskPlanner {
  private templates: Map<string, TaskStep[]> = new Map();
  private activeTasks: Map<string, Task> = new Map();
  
  constructor() {
    this.initTemplates();
  }
  
  private initTemplates(): void {
    this.templates.set('code', [
      { id: 0, description: '分析需求', action: 'analyze', status: 'pending' },
      { id: 1, description: '设计方案', action: 'design', status: 'pending' },
      { id: 2, description: '编写代码', action: 'implement', status: 'pending' },
      { id: 3, description: '测试验证', action: 'test', status: 'pending' },
      { id: 4, description: '优化完善', action: 'optimize', status: 'pending' },
    ]);
    
    this.templates.set('write', [
      { id: 0, description: '理解主题', action: 'understand', status: 'pending' },
      { id: 1, description: '列出大纲', action: 'outline', status: 'pending' },
      { id: 2, description: '撰写内容', action: 'draft', status: 'pending' },
      { id: 3, description: '修改润色', action: 'revise', status: 'pending' },
    ]);
    
    this.templates.set('research', [
      { id: 0, description: '明确目标', action: 'define', status: 'pending' },
      { id: 1, description: '搜索信息', action: 'search', status: 'pending' },
      { id: 2, description: '收集资料', action: 'collect', status: 'pending' },
      { id: 3, description: '分析整理', action: 'analyze', status: 'pending' },
      { id: 4, description: '总结归纳', action: 'summarize', status: 'pending' },
    ]);
    
    this.templates.set('analysis', [
      { id: 0, description: '收集数据', action: 'gather', status: 'pending' },
      { id: 1, description: '分析问题', action: 'analyze', status: 'pending' },
      { id: 2, description: '找出方案', action: 'solution', status: 'pending' },
      { id: 3, description: '评估建议', action: 'evaluate', status: 'pending' },
    ]);
    
    // 默认模板
    this.templates.set('default', [
      { id: 0, description: '理解任务', action: 'understand', status: 'pending' },
      { id: 1, description: '制定计划', action: 'plan', status: 'pending' },
      { id: 2, description: '执行任务', action: 'execute', status: 'pending' },
      { id: 3, description: '返回结果', action: 'respond', status: 'pending' },
    ]);
  }
  
  /**
   * 创建任务
   */
  createTask(type: string, title: string, context: Record<string, unknown> = {}): Task {
    const id = `task_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
    const template = this.templates.get(type) || this.templates.get('default');
    if (!template) {
      throw new Error(`No template found for type: ${type}`);
    }
    
    const task: Task = {
      id,
      type,
      title,
      description: '',
      steps: template.map((s, i) => ({ ...s, id: i })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      context,
    };
    
    this.activeTasks.set(id, task);
    return task;
  }
  
  /**
   * 获取任务
   */
  getTask(id: string): Task | undefined {
    return this.activeTasks.get(id);
  }
  
  /**
   * 获取当前任务
   */
  getCurrentTask(): Task | undefined {
    return Array.from(this.activeTasks.values()).find(t => t.status === 'running');
  }
  
  /**
   * 获取下一步
   */
  getNextStep(taskId: string): TaskStep | undefined {
    const task = this.activeTasks.get(taskId);
    if (!task) return undefined;
    return task.steps.find(s => s.status === 'pending') || undefined;
  }
  
  /**
   * 开始任务
   */
  startTask(taskId: string): Task | undefined {
    const task = this.activeTasks.get(taskId);
    if (!task) return undefined;
    
    task.status = 'running';
    const nextStep = task.steps.find(s => s.status === 'pending');
    if (nextStep) {
      nextStep.status = 'running';
    }
    
    return task;
  }
  
  /**
   * 完成步骤
   */
  completeStep(taskId: string, stepId: number, result?: unknown): Task | undefined {
    const task = this.activeTasks.get(taskId);
    if (!task) return undefined;
    
    const step = task.steps.find(s => s.id === stepId);
    if (step) {
      step.status = 'completed';
      step.result = result;
    }
    
    // 检查是否完成
    const pending = task.steps.filter(s => s.status === 'pending');
    if (pending.length === 0) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
    } else {
      // 启动下一步
      const next = pending[0];
      next.status = 'running';
    }
    
    return task;
  }
  
  /**
   * 失败步骤
   */
  failStep(taskId: string, stepId: number, error: string): Task | undefined {
    const task = this.activeTasks.get(taskId);
    if (!task) return undefined;
    
    const step = task.steps.find(s => s.id === stepId);
    if (step) {
      step.status = 'failed';
      step.error = error;
    }
    
    task.status = 'failed';
    return task;
  }
  
  /**
   * 取消任务
   */
  cancelTask(taskId: string): Task | undefined {
    const task = this.activeTasks.get(taskId);
    if (!task) return undefined;
    
    task.status = 'cancelled';
    return task;
  }
  
  /**
   * 获取所有活动任务
   */
  getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values()).filter(t => 
      t.status === 'pending' || t.status === 'running'
    );
  }
  
  /**
   * 清理已完成的任务
   */
  cleanup(): number {
    let cleaned = 0;
    for (const [id, task] of this.activeTasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.activeTasks.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// ============================================================================
// 决策系统
// ============================================================================

export class DecisionMaker {
  private safetyRules: SafetyRule[] = [];
  
  constructor() {
    this.initSafetyRules();
  }
  
  private initSafetyRules(): void {
    // 危险操作
    this.safetyRules.push({
      name: 'destructive',
      keywords: ['删除', '格式化', '清空', '卸载', 'drop', 'delete'],
      exceptions: ['测试', '临时', '备份'],
      severity: 'confirm',
      message: '这是一个破坏性操作',
    });
    
    // 敏感操作
    this.safetyRules.push({
      name: 'sensitive',
      keywords: ['密码', '密钥', '私钥', 'token', 'secret', '信用卡'],
      severity: 'warn',
      message: '涉及敏感信息，请注意保护',
    });
    
    // 危险请求
    this.safetyRules.push({
      name: 'harmful',
      keywords: ['攻击', '破解', '黑客', '病毒', '木马', '钓鱼'],
      severity: 'block',
      message: '无法执行可能造成伤害的请求',
    });
    
    // 非法请求
    this.safetyRules.push({
      name: 'illegal',
      keywords: ['盗版', '盗版', '作弊', '外挂', '盗取'],
      severity: 'block',
      message: '无法执行非法请求',
    });
  }
  
  /**
   * 评估决策
   */
  evaluate(action: string, context: Record<string, unknown> = {}): Decision {
    const actionLower = action.toLowerCase();
    const result: Decision = {
      allowed: true,
      risk: 'low',
      reason: '允许执行',
      warnings: [],
      needsConfirmation: false,
    };
    
    for (const rule of this.safetyRules) {
      const matched = rule.keywords.some(k => actionLower.includes(k.toLowerCase()));
      if (!matched) continue;
      
      // 检查例外
      const hasException = rule.exceptions?.some(e => actionLower.includes(e));
      if (hasException) continue;
      
      switch (rule.severity) {
        case 'block':
          result.allowed = false;
          result.risk = 'critical';
          result.reason = rule.message;
          return result;
          
        case 'confirm':
          result.allowed = true;
          result.risk = 'high';
          result.warnings.push(rule.message);
          result.needsConfirmation = true;
          result.conditions = [`需要确认: ${rule.message}`];
          break;
          
        case 'warn':
          result.warnings.push(rule.message);
          if (result.risk === 'low') result.risk = 'medium';
          break;
      }
    }
    
    // 额外风险评估
    if (context.destructive === true) {
      result.risk = 'high';
      result.needsConfirmation = true;
    }
    
    return result;
  }
  
  /**
   * 批量评估
   */
  evaluateBatch(actions: string[]): Decision[] {
    return actions.map(a => this.evaluate(a));
  }
}

// ============================================================================
// 学习引擎
// ============================================================================

export class LearningEngine {
  private config: CognitionConfig;
  private preferences: UserPreferences;
  private behaviorPatterns: Map<string, number> = new Map();
  private prefsFile: string;
  
  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
    this.prefsFile = path.join(this.config.dataDir, 'preferences.json');
    this.preferences = this.loadPreferences();
    this.loadBehaviorPatterns();
  }
  
  private loadPreferences(): UserPreferences {
    try {
      if (fs.existsSync(this.prefsFile)) {
        return JSON.parse(fs.readFileSync(this.prefsFile, 'utf-8'));
      }
    } catch {
      // 忽略
    }
    return this.getDefaultPreferences();
  }
  
  private getDefaultPreferences(): UserPreferences {
    return {
      communicationStyle: 'friendly',
      detailLevel: 'medium',
      problemApproach: 'analysis',
      humor: 'light',
      empathy: 'medium',
    };
  }
  
  private loadBehaviorPatterns(): void {
    const patternsFile = path.join(this.config.dataDir, 'behavior_patterns.json');
    try {
      if (fs.existsSync(patternsFile)) {
        const data = JSON.parse(fs.readFileSync(patternsFile, 'utf-8'));
        this.behaviorPatterns = new Map(Object.entries(data));
      }
    } catch {
      // 忽略
    }
  }
  
  private savePreferences(): void {
    const dir = path.dirname(this.prefsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.prefsFile, JSON.stringify(this.preferences, null, 2));
  }
  
  private saveBehaviorPatterns(): void {
    const patternsFile = path.join(this.config.dataDir, 'behavior_patterns.json');
    const data = Object.fromEntries(this.behaviorPatterns);
    fs.writeFileSync(patternsFile, JSON.stringify(data, null, 2));
  }
  
  /**
   * 学习反馈
   */
  learn(feedback: string): UserPreferences {
    const text = feedback.toLowerCase();
    
    // 详细程度
    if (text.includes('详细') || text.includes('多说') || text.includes('具体')) {
      this.preferences.detailLevel = 'high';
    } else if (text.includes('简单') || text.includes('少说') || text.includes('简洁')) {
      this.preferences.detailLevel = 'low';
    }
    
    // 沟通风格
    if (text.includes('直接') || text.includes('简洁') || text.includes('干脆')) {
      this.preferences.communicationStyle = 'direct';
    } else if (text.includes('温柔') || text.includes('亲切') || text.includes('暖')) {
      this.preferences.communicationStyle = 'friendly';
    } else if (text.includes('正式') || text.includes('规范')) {
      this.preferences.communicationStyle = 'formal';
    } else if (text.includes('轻松') || text.includes('随意')) {
      this.preferences.communicationStyle = 'casual';
    }
    
    // 问题解决方式
    if (text.includes('直接给') || text.includes('告诉答案')) {
      this.preferences.problemApproach = 'direct';
    } else if (text.includes('给选项') || text.includes('几个方案')) {
      this.preferences.problemApproach = 'options';
    } else if (text.includes('分析') || text.includes('解释')) {
      this.preferences.problemApproach = 'analysis';
    }
    
    // 同理心
    if (text.includes('理解') || text.includes('懂你')) {
      this.preferences.empathy = 'high';
    } else if (text.includes('冷漠') || text.includes('不懂')) {
      this.preferences.empathy = 'low';
    }
    
    this.savePreferences();
    return this.preferences;
  }
  
  /**
   * 记录行为模式
   */
  recordBehavior(action: string): void {
    const count = this.behaviorPatterns.get(action) || 0;
    this.behaviorPatterns.set(action, count + 1);
    
    // 定期保存
    if (this.behaviorPatterns.size % 10 === 0) {
      this.saveBehaviorPatterns();
    }
  }
  
  /**
   * 获取高频行为
   */
  getFrequentBehaviors(limit: number = 5): [string, number][] {
    return Array.from(this.behaviorPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
  
  /**
   * 获取偏好
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }
  
  /**
   * 设置偏好
   */
  setPreferences(prefs: Partial<UserPreferences>): UserPreferences {
    this.preferences = { ...this.preferences, ...prefs };
    this.savePreferences();
    return this.preferences;
  }
}

// ============================================================================
// 上下文管理器
// ============================================================================

export class ContextManager {
  private config: CognitionConfig;
  private context: Context;
  
  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
    this.context = {
      messages: [],
      entities: [],
    };
  }
  
  /**
   * 添加消息
   */
  addMessage(role: Message['role'], content: string, intent?: Intent): void {
    this.context.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      intent,
    });
    
    // 限制历史长度
    if (this.context.messages.length > this.config.maxHistoryLength) {
      this.context.messages = this.context.messages.slice(-this.config.maxHistoryLength);
    }
  }
  
  /**
   * 添加实体
   */
  addEntity(entity: Entity): void {
    // 更新或添加
    const existing = this.context.entities.findIndex(e => e.type === entity.type && e.value === entity.value);
    if (existing >= 0) {
      this.context.entities[existing] = entity;
    } else {
      this.context.entities.push(entity);
    }
    
    // 限制实体数量
    if (this.context.entities.length > 20) {
      this.context.entities = this.context.entities.slice(-20);
    }
  }
  
  /**
   * 获取最后N条消息
   */
  getRecentMessages(count: number = 5): Message[] {
    return this.context.messages.slice(-count);
  }
  
  /**
   * 获取最后用户消息
   */
  getLastUserMessage(): Message | undefined {
    for (let i = this.context.messages.length - 1; i >= 0; i--) {
      if (this.context.messages[i].role === 'user') {
        return this.context.messages[i];
      }
    }
    return undefined;
  }
  
  /**
   * 获取最后助手消息
   */
  getLastAssistantMessage(): Message | undefined {
    for (let i = this.context.messages.length - 1; i >= 0; i--) {
      if (this.context.messages[i].role === 'assistant') {
        return this.context.messages[i];
      }
    }
    return undefined;
  }
  
  /**
   * 获取实体
   */
  getEntities(type?: string): Entity[] {
    if (!type) return [...this.context.entities];
    return this.context.entities.filter(e => e.type === type);
  }
  
  /**
   * 设置当前任务
   */
  setTask(task: Task): void {
    this.context.task = task;
  }
  
  /**
   * 获取当前任务
   */
  getTask(): Task | undefined {
    return this.context.task;
  }
  
  /**
   * 获取完整上下文
   */
  getContext(): Context {
    return { ...this.context, messages: [...this.context.messages] };
  }
  
  /**
   * 清空上下文
   */
  clear(): void {
    this.context = {
      messages: [],
      entities: [],
    };
  }
}

// ============================================================================
// 认知系统主类
// ============================================================================

export class CognitionSystem {
  private config: CognitionConfig;
  
  private reasoningEngine: ReasoningEngine;
  private intentRecognizer: IntentRecognizer;
  private taskPlanner: TaskPlanner;
  private decisionMaker: DecisionMaker;
  private learningEngine: LearningEngine;
  private contextManager: ContextManager;

  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
    
    this.reasoningEngine = new ReasoningEngine();
    this.intentRecognizer = new IntentRecognizer();
    this.taskPlanner = new TaskPlanner();
    this.decisionMaker = new DecisionMaker();
    this.learningEngine = new LearningEngine(workspaceDir);
    this.contextManager = new ContextManager(workspaceDir);
  }

  // ==================== 意图识别 ====================
  
  /**
   * 识别意图
   */
  recognizeIntent(text: string): Intent {
    return this.intentRecognizer.recognize(text);
  }

  // ==================== 推理 ====================
  
  /**
   * 推理
   */
  reason(): { triggered: string; result: unknown } | null {
    return this.reasoningEngine.reason(this.contextManager.getContext());
  }

  // ==================== 任务管理 ====================
  
  /**
   * 创建任务
   */
  createTask(type: string, title: string, context?: Record<string, unknown>): Task {
    const task = this.taskPlanner.createTask(type, title, context);
    this.contextManager.setTask(task);
    return task;
  }
  
  /**
   * 获取当前任务
   */
  getCurrentTask(): Task | undefined {
    return this.taskPlanner.getCurrentTask();
  }
  
  /**
   * 开始任务
   */
  startTask(taskId: string): Task | undefined {
    return this.taskPlanner.startTask(taskId);
  }
  
  /**
   * 完成步骤
   */
  completeStep(taskId: string, stepId: number, result?: unknown): Task | undefined {
    return this.taskPlanner.completeStep(taskId, stepId, result);
  }
  
  /**
   * 获取活动任务
   */
  getActiveTasks(): Task[] {
    return this.taskPlanner.getActiveTasks();
  }

  // ==================== 决策 ====================
  
  /**
   * 评估决策
   */
  evaluate(action: string, context?: Record<string, unknown>): Decision {
    return this.decisionMaker.evaluate(action, context);
  }

  // ==================== 学习 ====================
  
  /**
   * 学习反馈
   */
  learn(feedback: string): UserPreferences {
    return this.learningEngine.learn(feedback);
  }
  
  /**
   * 记录行为
   */
  recordBehavior(action: string): void {
    this.learningEngine.recordBehavior(action);
  }
  
  /**
   * 获取偏好
   */
  getPreferences(): UserPreferences {
    return this.learningEngine.getPreferences();
  }
  
  /**
   * 设置偏好
   */
  setPreferences(prefs: Partial<UserPreferences>): UserPreferences {
    return this.learningEngine.setPreferences(prefs);
  }

  // ==================== 上下文 ====================
  
  /**
   * 添加用户消息
   */
  addUserMessage(content: string): Intent {
    const intent = this.recognizeIntent(content);
    this.contextManager.addMessage('user', content, intent);
    return intent;
  }
  
  /**
   * 添加助手消息
   */
  addAssistantMessage(content: string): void {
    this.contextManager.addMessage('assistant', content);
  }
  
  /**
   * 获取最近消息
   */
  getRecentMessages(count?: number): Message[] {
    return this.contextManager.getRecentMessages(count);
  }
  
  /**
   * 获取实体
   */
  getEntities(type?: string): Entity[] {
    return this.contextManager.getEntities(type);
  }
  
  /**
   * 清空上下文
   */
  clearContext(): void {
    this.contextManager.clear();
  }

  // ==================== 整合处理 ====================
  
  /**
   * 处理用户输入（整合流程）
   */
  process(userInput: string): {
    intent: Intent;
    decision: Decision;
    task?: Task;
    reasoning?: { triggered: string; result: unknown };
    preferences: UserPreferences;
  } {
    // 1. 识别意图
    const intent = this.addUserMessage(userInput);
    
    // 2. 推理
    const reasoning = this.reason();
    
    // 3. 评估决策
    const decision = this.decisionMaker.evaluate(intent.action || intent.type, intent.context);
    
    // 4. 如果允许，创建任务
    let task: Task | undefined;
    if (decision.allowed && (intent.type === 'task' || intent.type === 'create')) {
      task = this.createTask(intent.type, userInput, { intent });
    }
    
    // 5. 记录行为
    this.recordBehavior(intent.type);
    
    return {
      intent,
      decision,
      task,
      reasoning: reasoning || undefined,
      preferences: this.getPreferences(),
    };
  }

  // ==================== 状态 ====================
  
  /**
   * 获取完整状态
   */
  getStatus(): {
    preferences: UserPreferences;
    activeTasks: Task[];
    recentMessages: number;
    frequentBehaviors: [string, number][];
  } {
    return {
      preferences: this.getPreferences(),
      activeTasks: this.getActiveTasks(),
      recentMessages: this.contextManager.getRecentMessages().length,
      frequentBehaviors: this.learningEngine.getFrequentBehaviors(),
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

export function createCognitionSystem(workspaceDir?: string): CognitionSystem {
  return new CognitionSystem(workspaceDir);
}

export default CognitionSystem;
