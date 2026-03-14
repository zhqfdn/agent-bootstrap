/**
 * Input System - 完善版输入感知系统 (TypeScript)
 * 
 * 改进：
 * - 上下文感知（对话历史）
 * - 情感分析增强
 * - 意图消歧
 * - 实体关系提取
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// 类型定义
// ============================================================================

// 意图类型
export type IntentType = 
  | 'command' | 'task' | 'question' | 'chat' | 'confirm' | 'cancel'
  | 'complaint' | 'praise' | 'emotional'
  | 'create' | 'read' | 'update' | 'delete' | 'search' | 'execute';

// 实体类型
export type EntityType = 'time' | 'date' | 'number' | 'code' | 'url' | 'file' | 'person' | 'location' | 'keyword';

// 实体
export interface Entity {
  type: EntityType;
  value: string;
  normalized?: string;
  start: number;
  end: number;
  confidence: number;
}

// 情感
export interface Emotion {
  sentiment: number;      // -1 到 1
  stress: number;         // 0 到 1
  urgency: number;        // 0 到 1
  mood: string;
}

// 意图
export interface Intent {
  type: IntentType;
  confidence: number;
  action?: string;
  entities: Entity[];
  emotion: Emotion;
  slots: Record<string, unknown>;
  context: Record<string, unknown>;
  ambiguity: boolean;      // 是否有歧义
  alternatives: IntentType[];  // 可能的替代意图
}

// 消息历史
export interface MessageHistory {
  role: 'user' | 'assistant';
  content: string;
  intent?: Intent;
  timestamp: string;
}

// 输入上下文
export interface InputContext {
  recentMessages: MessageHistory[];
  entities: Entity[];
  pendingConfirmation?: { question: string; expected: string };
  topic?: string;
}

// ============================================================================
// 配置
// ============================================================================

interface InputConfig {
  workspaceDir: string;
  maxHistoryLength: number;
  confidenceThreshold: number;
}

function getConfig(workspaceDir?: string): InputConfig {
  const wsDir = workspaceDir || path.join(os.homedir(), '.openclaw', 'workspace');
  return {
    workspaceDir: wsDir,
    maxHistoryLength: 10,
    confidenceThreshold: 0.6,
  };
}

// ============================================================================
// 情感分析器
// ============================================================================

class EmotionAnalyzer {
  private positiveWords = [
    '好', '棒', '赞', '喜欢', '谢谢', '太棒', '开心', '高兴', '成功', '牛', '强',
    '完美', '优秀', '出色', '满意', '感谢', '感恩', '爱', '哈哈', '耶', '么么哒'
  ];
  
  private negativeWords = [
    '不好', '糟', '差', '失败', '错', '问题', '麻烦', '累', '烦', '难', '讨厌',
    '生气', '愤怒', '难过', '伤心', '哭', '郁闷', '不爽', '悲剧', '可惜', '无奈',
    '无语', '抓狂', '崩溃', '傻', '蠢', '笨', '烦死了', '滚'
  ];
  
  private stressWords = [
    '急', '担心', '害怕', '焦虑', '紧张', '慌', '压力', '不安', '恐惧',
    '怎么办', '会不会', '能不能', '好怕', '吓', '慌死了', '压力山大'
  ];
  
  private urgentWords = ['马上', '立刻', '立即', '赶紧', '着急', '十万火急', ' ASAP'];
  
  analyze(text: string): Emotion {
    const lower = text.toLowerCase();
    let sentiment = 0;
    let stress = 0;
    let urgency = 0;
    
    // 情感分析
    for (const word of this.positiveWords) {
      if (lower.includes(word)) sentiment += 0.15;
    }
    for (const word of this.negativeWords) {
      if (lower.includes(word)) sentiment -= 0.15;
    }
    for (const word of this.stressWords) {
      if (lower.includes(word)) stress += 0.25;
    }
    for (const word of this.urgentWords) {
      if (lower.includes(word)) urgency += 0.3;
    }
    
    // 边界限制
    sentiment = Math.max(-1, Math.min(1, sentiment));
    stress = Math.min(1, stress);
    urgency = Math.min(1, urgency);
    
    // 判断心情
    let mood = 'neutral';
    if (text.includes('?') || text.includes('？')) mood = 'curious';
    else if (sentiment > 0.4) mood = 'happy';
    else if (sentiment < -0.4) mood = 'sad';
    else if (stress > 0.5) mood = 'anxious';
    else if (text.includes('!') || text.includes('！')) mood = 'excited';
    
    return { sentiment, stress, urgency, mood };
  }
}

// ============================================================================
// 实体提取器
// ============================================================================

class EntityExtractor {
  extract(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // 时间
    const timePatterns = [
      /(\d{1,2})[时分](?:(\d{1,2})分?)?/g,
      /(上午|下午|早上|晚上|中午|凌晨)(\d{1,2})[时分]?/g,
    ];
    
    for (const pattern of timePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'time',
          value: match[0],
          normalized: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.9,
        });
      }
    }
    
    // 日期
    const datePatterns = [
      /(\d{1,4})[年/\-](\d{1,2})[月/\-](\d{1,2})?[日号]?/g,
      /(今天|明天|后天|昨天|前天|上周|下周|这个月|下个月)(\s*\d{1,2})?[日号]?/g,
    ];
    
    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'date',
          value: match[0],
          normalized: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.9,
        });
      }
    }
    
    // 数字
    const numberPattern = /\d+(\.\d+)?/g;
    let match;
    while ((match = numberPattern.exec(text)) !== null) {
      // 排除时间和日期中的数字
      const isPartOfOther = entities.some(e => 
        match!.index >= e.start && match!.index < e.end
      );
      if (!isPartOfOther) {
        entities.push({
          type: 'number',
          value: match[0],
          normalized: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.7,
        });
      }
    }
    
    // URL
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    while ((match = urlPattern.exec(text)) !== null) {
      entities.push({
        type: 'url',
        value: match[0],
        normalized: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.95,
      });
    }
    
    // 代码块
    const codePattern = /```[\s\S]*?```|`[^`]+`|```[^`]+```/g;
    while ((match = codePattern.exec(text)) !== null) {
      entities.push({
        type: 'code',
        value: match[0],
        normalized: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.95,
      });
    }
    
    // 文件路径
    const filePattern = /(?:\/|[a-zA-Z]:\\)[^\s<>"{}|\\^`\[\]]+\.[a-zA-Z0-9]+/g;
    while ((match = filePattern.exec(text)) !== null) {
      entities.push({
        type: 'file',
        value: match[0],
        normalized: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.8,
      });
    }
    
    return entities;
  }
}

// ============================================================================
// 意图识别器
// ============================================================================

class IntentRecognizer {
  private keywords: Record<IntentType, string[]> = {
    command: ['/', '命令', '执行'],
    task: ['做', '完成', '处理', '帮我', '要你', '搞定', '实现'],
    question: ['什么', '怎么', '如何', '为什么', '是不是', '有没有', '能否', '可以吗', '?', '？'],
    chat: ['好', '嗯', '啊', '哈', '嘿', '哟', '今天', '天气', '周末', '干嘛'],
    confirm: ['好的', '可以', '是的', '对', '同意', '确定', '行', '收到'],
    cancel: ['算了', '不要', '取消', '别', '停止', '中止'],
    complaint: ['不好', '太差', '不满意', '生气', '怒', '坑', '烂', '垃圾'],
    praise: ['好棒', '赞', '不错', '喜欢', '谢谢', '感谢', '牛', '强', '厉害'],
    emotional: ['开心', '难过', '累', '困', '烦', '郁闷', '爽', '激动'],
    create: ['新建', '创建', '添加', '写', '做一个', '开发'],
    read: ['查看', '看看', '找', '读', '有什么', '展示'],
    update: ['修改', '更新', '改', '编辑', '调整', '优化'],
    delete: ['删除', '去掉', '清除', '不要了', '移除'],
    search: ['搜索', '找找', '查一下', '查找', '搜'],
    execute: ['运行', '执行', '跑', '启动', '开始', '运行一下'],
  };
  
  recognize(text: string, context?: InputContext): Intent {
    const textLower = text.toLowerCase();
    const scores: Record<IntentType, number> = {} as Record<IntentType, number>;
    
    // 计算每种意图的得分
    for (const [intent, keywords] of Object.entries(this.keywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      scores[intent as IntentType] = score;
    }
    
    // 排序获取最佳意图
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);
    
    const bestIntent = sorted[0][0] as IntentType;
    const bestScore = sorted[0][1];
    const secondScore = sorted[1]?.[1] || 0;
    
    // 判断是否有歧义（第一和第二得分接近）
    const ambiguity = bestScore > 0 && (bestScore - secondScore) <= 1;
    
    // 获取可能的替代意图
    const alternatives = sorted
      .filter(([, s]) => s > 0)
      .slice(1, 4)
      .map(([i]) => i as IntentType);
    
    // 计算置信度
    let confidence = 0.3;
    if (bestScore > 0) {
      confidence = Math.min(0.95, 0.4 + bestScore * 0.15);
    }
    
    // 如果是命令，置信度更高
    if (text.startsWith('/')) {
      confidence = 0.95;
    }
    
    // 提取动作
    const action = this.extractAction(text, bestIntent);
    
    return {
      type: bestIntent,
      confidence,
      action,
      entities: [],
      emotion: { sentiment: 0, stress: 0, urgency: 0, mood: 'neutral' },
      slots: this.extractSlots(text),
      context: {},
      ambiguity,
      alternatives,
    };
  }
  
  private extractAction(text: string, intent: IntentType): string | undefined {
    const actionMap: Record<string, string> = {
      '做': 'do', '完成': 'complete', '处理': 'process', '搞定': 'finish',
      '查看': 'view', '看看': 'view', '找': 'find', '搜索': 'search',
      '创建': 'create', '新建': 'create', '添加': 'add',
      '删除': 'delete', '去掉': 'remove', '清除': 'clear',
      '修改': 'update', '更新': 'update', '改': 'modify',
      '执行': 'execute', '运行': 'run', '跑': 'run',
      '启动': 'start', '开始': 'start',
    };
    
    for (const [word, action] of Object.entries(actionMap)) {
      if (text.includes(word)) return action;
    }
    
    return undefined;
  }
  
  private extractSlots(text: string): Record<string, unknown> {
    const words = text.split(/\s+/).filter(w => w.length >= 2);
    return {
      keywords: words.slice(0, 5),
      length: text.length,
    };
  }
}

// ============================================================================
// 输入分析器主类
// ============================================================================

export class InputSystem {
  private config: InputConfig;
  private emotionAnalyzer: EmotionAnalyzer;
  private entityExtractor: EntityExtractor;
  private intentRecognizer: IntentRecognizer;
  private context: InputContext;
  
  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.entityExtractor = new EntityExtractor();
    this.intentRecognizer = new IntentRecognizer();
    this.context = {
      recentMessages: [],
      entities: [],
    };
  }
  
  // ==================== 分析 ====================
  
  /**
   * 分析输入
   */
  analyze(text: string): Intent {
    // 1. 实体提取
    const entities = this.entityExtractor.extract(text);
    
    // 2. 情感分析
    const emotion = this.emotionAnalyzer.analyze(text);
    
    // 3. 意图识别
    const intent = this.intentRecognizer.recognize(text, this.context);
    
    // 4. 合并结果
    intent.entities = entities;
    intent.emotion = emotion;
    
    // 5. 添加到上下文
    this.addToHistory('user', text, intent);
    this.updateContextEntities(entities);
    
    return intent;
  }
  
  // ==================== 上下文管理 ====================
  
  /**
   * 添加到历史
   */
  addToHistory(role: 'user' | 'assistant', content: string, intent?: Intent): void {
    this.context.recentMessages.push({
      role,
      content,
      intent,
      timestamp: new Date().toISOString(),
    });
    
    // 限制长度
    if (this.context.recentMessages.length > this.config.maxHistoryLength) {
      this.context.recentMessages = this.context.recentMessages.slice(-this.config.maxHistoryLength);
    }
  }
  
  /**
   * 更新实体上下文
   */
  private updateContextEntities(newEntities: Entity[]): void {
    for (const entity of newEntities) {
      const exists = this.context.entities.some(e => 
        e.type === entity.type && e.value === entity.value
      );
      if (!exists) {
        this.context.entities.push(entity);
      }
    }
    
    // 限制实体数量
    if (this.context.entities.length > 20) {
      this.context.entities = this.context.entities.slice(-20);
    }
  }
  
  /**
   * 获取最近消息
   */
  getRecentMessages(count?: number): MessageHistory[] {
    const c = count || this.config.maxHistoryLength;
    return this.context.recentMessages.slice(-c);
  }
  
  /**
   * 获取上下文实体
   */
  getContextEntities(type?: EntityType): Entity[] {
    if (!type) return [...this.context.entities];
    return this.context.entities.filter(e => e.type === type);
  }
  
  /**
   * 设置待确认项
   */
  setPendingConfirmation(question: string, expected: string): void {
    this.context.pendingConfirmation = { question, expected };
  }
  
  /**
   * 清除待确认
   */
  clearPendingConfirmation(): void {
    this.context.pendingConfirmation = undefined;
  }
  
  /**
   * 获取上下文
   */
  getContext(): InputContext {
    return { ...this.context };
  }
  
  /**
   * 清空上下文
   */
  clear(): void {
    this.context = {
      recentMessages: [],
      entities: [],
    };
  }
  
  // ==================== 便捷方法 ====================
  
  /**
   * 检查是否是问题
   */
  isQuestion(text: string): boolean {
    return text.includes('?') || text.includes('？') || 
           text.includes('怎么') || text.includes('如何') || text.includes('为什么');
  }
  
  /**
   * 检查是否需要确认
   */
  needsConfirmation(text: string): boolean {
    const destructive = ['删除', '删除', '格式化', '清空', '卸载'];
    return destructive.some(w => text.includes(w));
  }
  
  /**
   * 提取主题
   */
  extractTopic(text: string): string {
    // 简单的主题提取
    const words = text.split(/[\s,，。！？]/).filter(w => w.length >= 2);
    return words[0] || 'unknown';
  }
  
  // ==================== 状态 ====================
  
  /**
   * 获取状态
   */
  getStatus(): {
    historyLength: number;
    entityCount: number;
    hasPendingConfirmation: boolean;
  } {
    return {
      historyLength: this.context.recentMessages.length,
      entityCount: this.context.entities.length,
      hasPendingConfirmation: !!this.context.pendingConfirmation,
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

export function createInputSystem(workspaceDir?: string): InputSystem {
  return new InputSystem(workspaceDir);
}

export default InputSystem;
