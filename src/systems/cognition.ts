/**
 * Cognition System - 认知系统 (TypeScript 版)
 * 推理规划与决策
 */

import * as fs from 'fs';
import * as path from 'path';

// 任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

// 任务步骤
export interface TaskStep {
  id: number;
  description: string;
  action: string;
  status: TaskStatus;
}

// 任务
export interface Task {
  id: string;
  title: string;
  description: string;
  steps: TaskStep[];
  status: TaskStatus;
  createdAt: string;
}

// 决策结果
export interface Decision {
  allowed: boolean;
  reason: string;
  warnings: string[];
}

// 用户偏好
export interface UserPreferences {
  communicationStyle: 'direct' | 'friendly' | 'formal' | 'casual';
  detailLevel: 'low' | 'medium' | 'high';
  problemApproach: 'direct' | 'options' | 'analysis';
}

// 任务规划器
export class TaskPlanner {
  private templates: Record<string, TaskStep[]> = {
    code: [
      { id: 0, description: '分析需求', action: 'analyze', status: 'pending' },
      { id: 1, description: '设计方案', action: 'design', status: 'pending' },
      { id: 2, description: '编写代码', action: 'implement', status: 'pending' },
      { id: 3, description: '测试验证', action: 'test', status: 'pending' },
    ],
    write: [
      { id: 0, description: '列出大纲', action: 'outline', status: 'pending' },
      { id: 1, description: '撰写内容', action: 'draft', status: 'pending' },
      { id: 2, description: '修改润色', action: 'revise', status: 'pending' },
    ],
    research: [
      { id: 0, description: '搜索信息', action: 'search', status: 'pending' },
      { id: 1, description: '收集资料', action: 'collect', status: 'pending' },
      { id: 2, description: '总结归纳', action: 'summarize', status: 'pending' },
    ],
  };
  
  // 创建任务
  createTask(type: string, title: string): Task {
    const steps = this.templates[type] || [
      { id: 0, description: '理解任务', action: 'understand', status: 'pending' },
      { id: 1, description: '执行任务', action: 'execute', status: 'pending' },
      { id: 2, description: '返回结果', action: 'respond', status: 'pending' },
    ];
    
    return {
      id: `task_${Date.now()}`,
      title,
      description: '',
      steps: steps.map((s, i) => ({ ...s, id: i })),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }
  
  // 获取下一步
  getNextStep(task: Task): TaskStep | null {
    return task.steps.find(s => s.status === 'pending') || null;
  }
  
  // 完成步骤
  completeStep(task: Task, stepId: number): Task {
    const step = task.steps.find(s => s.id === stepId);
    if (step) {
      step.status = 'completed';
      if (task.steps.every(s => s.status === 'completed')) {
        task.status = 'completed';
      }
    }
    return task;
  }
}

// 决策判断
export class DecisionMaker {
  private safetyRules: [string, string][] = [
    ['harmful', '拒绝执行可能造成伤害的请求'],
    ['illegal', '拒绝执行非法请求'],
    ['privacy', '保护用户隐私，不泄露敏感信息'],
    ['honest', '诚实回答，不欺骗'],
  ];
  
  // 评估决策
  evaluate(action: string, context: Record<string, unknown> = {}): Decision {
    const actionLower = action.toLowerCase();
    const result: Decision = {
      allowed: true,
      reason: '允许执行',
      warnings: [],
    };
    
    // 检查安全规则
    for (const [rule, message] of this.safetyRules) {
      if (rule === 'harmful') {
        const harmfulWords = ['删除', '破坏', '攻击', '破解'];
        if (harmfulWords.some(w => actionLower.includes(w)) && !actionLower.includes('测试')) {
          result.allowed = false;
          result.reason = message;
        }
      } else if (rule === 'illegal') {
        const illegalWords = ['破解', '盗取', '作弊', '木马'];
        if (illegalWords.some(w => actionLower.includes(w))) {
          result.allowed = false;
          result.reason = message;
        }
      }
    }
    
    // 敏感操作警告
    const sensitiveWords = ['删除', '修改系统', '格式化'];
    if (sensitiveWords.some(w => actionLower.includes(w))) {
      result.warnings.push('这是敏感操作，建议确认');
    }
    
    return result;
  }
}

// 学习引擎
export class LearningEngine {
  private prefsFile: string;
  private preferences: UserPreferences;
  
  constructor(dataDir: string = '') {
    const dir = dataDir || path.join(process.env.HOME || '', '.openclaw/workspace/memory');
    this.prefsFile = path.join(dir, 'learned_preferences.json');
    this.preferences = this.loadPreferences();
  }
  
  private loadPreferences(): UserPreferences {
    try {
      if (fs.existsSync(this.prefsFile)) {
        return JSON.parse(fs.readFileSync(this.prefsFile, 'utf-8'));
      }
    } catch (e) {
      // 忽略
    }
    return {
      communicationStyle: 'friendly',
      detailLevel: 'medium',
      problemApproach: 'analysis',
    };
  }
  
  private savePreferences(): void {
    const dir = path.dirname(this.prefsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.prefsFile, JSON.stringify(this.preferences, null, 2));
  }
  
  // 调整风格
  adjustStyle(feedback: string): UserPreferences {
    const text = feedback.toLowerCase();
    
    if (text.includes('详细') || text.includes('多说')) {
      this.preferences.detailLevel = 'high';
    } else if (text.includes('简单') || text.includes('少说')) {
      this.preferences.detailLevel = 'low';
    }
    
    if (text.includes('直接') || text.includes('简洁')) {
      this.preferences.communicationStyle = 'direct';
    } else if (text.includes('温柔') || text.includes('亲切')) {
      this.preferences.communicationStyle = 'friendly';
    }
    
    this.savePreferences();
    return this.preferences;
  }
  
  // 获取偏好
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }
}

// 认知系统主类
export class CognitionSystem {
  private planner: TaskPlanner;
  private decisionMaker: DecisionMaker;
  private learner: LearningEngine;
  private currentTask: Task | null = null;
  
  constructor(dataDir: string = '') {
    this.planner = new TaskPlanner();
    this.decisionMaker = new DecisionMaker();
    this.learner = new LearningEngine(dataDir);
  }
  
  // 处理输入
  process(intent: { type: string; action?: string }, context: Record<string, unknown> = {}): {
    allowed: boolean;
    task?: Task;
    nextStep?: string;
    decision: Decision;
    preferences: UserPreferences;
  } {
    const action = intent.action || intent.type;
    
    // 决策评估
    const decision = this.decisionMaker.evaluate(action, context);
    
    if (!decision.allowed) {
      return {
        allowed: false,
        decision,
        preferences: this.learner.getPreferences(),
      };
    }
    
    // 创建任务
    this.currentTask = this.planner.createTask(intent.type, action);
    const nextStep = this.planner.getNextStep(this.currentTask);
    
    return {
      allowed: true,
      task: this.currentTask,
      nextStep: nextStep?.description,
      decision,
      preferences: this.learner.getPreferences(),
    };
  }
  
  // 执行步骤
  executeStep(stepId: number): { completed: number; nextStep?: string; done: boolean } {
    if (!this.currentTask) {
      return { completed: -1, done: false };
    }
    
    this.currentTask = this.planner.completeStep(this.currentTask, stepId);
    const next = this.planner.getNextStep(this.currentTask);
    
    return {
      completed: stepId,
      nextStep: next?.description,
      done: this.currentTask.status === 'completed',
    };
  }
  
  // 学习反馈
  learn(feedback: string): UserPreferences {
    return this.learner.adjustStyle(feedback);
  }
  
  // 获取状态
  getStatus(): { hasTask: boolean; taskId?: string; preferences: UserPreferences } {
    return {
      hasTask: this.currentTask !== null,
      taskId: this.currentTask?.id,
      preferences: this.learner.getPreferences(),
    };
  }
}

export default CognitionSystem;
