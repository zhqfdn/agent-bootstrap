/**
 * Input System - 输入感知系统 (TypeScript 版)
 * 意图识别与实体提取
 */

// 意图类型
export type IntentType = 
  | 'command' | 'task' | 'question' | 'chat' | 'confirm' | 'cancel'
  | 'complaint' | 'praise' | 'emotional'
  | 'create' | 'read' | 'update' | 'delete' | 'search' | 'execute';

// 实体类型
export type EntityType = 'time' | 'date' | 'number' | 'code' | 'url' | 'file' | 'keyword';

// 实体
export interface Entity {
  type: EntityType;
  value: string;
  start: number;
  end: number;
}

// 意图
export interface Intent {
  type: IntentType;
  confidence: number;
  action?: string;
  entities: Entity[];
  slots: Record<string, unknown>;
}

// 意图关键词映射
const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  command: ['/', '命令', '执行'],
  task: ['做', '完成', '处理', '帮我', '要你'],
  question: ['什么', '怎么', '如何', '为什么', '?', '？', '是不是', '有没有'],
  chat: ['好', '嗯', '啊', '哈', '嘿', '哟'],
  confirm: ['好的', '可以', '是的', '对', '同意'],
  cancel: ['算了', '不要', '取消'],
  complaint: ['不好', '太差', '不满意', '生气', '怒'],
  praise: ['好棒', '赞', '不错', '喜欢', '谢谢'],
  emotional: ['开心', '难过', '累', '困', '烦'],
  create: ['新建', '创建', '添加', '写'],
  read: ['查看', '看看', '找', '读'],
  update: ['修改', '更新', '改', '编辑'],
  delete: ['删除', '去掉', '清除'],
  search: ['搜索', '找找', '查一下'],
  execute: ['运行', '执行', '跑', '启动'],
};

// 意图 emoji
export const INTENT_EMOJI: Record<IntentType, string> = {
  command: '⚡', task: '📋', question: '❓', chat: '💬', confirm: '✅',
  cancel: '❌', complaint: '😤', praise: '👍', emotional: '💕',
  create: '➕', read: '👁️', update: '✏️', delete: '🗑️', search: '🔍', execute: '▶️'
};

// 输入分析器类
export class InputAnalyzer {
  private context: Record<string, unknown> = {};
  
  // 设置上下文
  setContext(ctx: Record<string, unknown>): void {
    this.context = { ...this.context, ...ctx };
  }
  
  // 分析输入
  analyze(text: string): Intent {
    // 检查是否是命令
    if (text.startsWith('/')) {
      return this.analyzeCommand(text);
    }
    
    // 识别意图
    const intentType = this.detectIntent(text);
    
    // 提取实体
    const entities = this.extractEntities(text);
    
    // 提取动作
    const action = this.extractAction(text, intentType);
    
    // 计算置信度
    const confidence = this.calculateConfidence(text, intentType);
    
    return {
      type: intentType,
      confidence,
      action,
      entities,
      slots: this.extractSlots(text),
    };
  }
  
  // 分析命令
  private analyzeCommand(text: string): Intent {
    const match = text.match(/^\/(\w+)\s*(.*)$/);
    if (match) {
      return {
        type: 'command',
        confidence: 1,
        action: match[1],
        entities: [],
        slots: { args: match[2].trim() },
      };
    }
    return {
      type: 'command',
      confidence: 0.5,
      action: text.slice(1).split(' ')[0],
      entities: [],
      slots: {},
    };
  }
  
  // 检测意图类型
  private detectIntent(text: string): IntentType {
    const textLower = text.toLowerCase();
    let maxScore = 0;
    let detectedIntent: IntentType = 'chat';
    
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      const score = keywords.filter(kw => textLower.includes(kw)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent as IntentType;
      }
    }
    
    return detectedIntent;
  }
  
  // 提取实体
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // 时间
    const timeRegex = /(\d{1,2})[时分]/g;
    let match;
    while ((match = timeRegex.exec(text)) !== null) {
      entities.push({ type: 'time', value: match[0], start: match.index, end: match.index + match[0].length });
    }
    
    // 数字
    const numberRegex = /\d+/g;
    while ((match = numberRegex.exec(text)) !== null) {
      entities.push({ type: 'number', value: match[0], start: match.index, end: match.index + match[0].length });
    }
    
    // URL
    const urlRegex = /https?:\/\/[^\s]+/g;
    while ((match = urlRegex.exec(text)) !== null) {
      entities.push({ type: 'url', value: match[0], start: match.index, end: match.index + match[0].length });
    }
    
    // 代码块
    const codeRegex = /`[^`]+`/g;
    while ((match = codeRegex.exec(text)) !== null) {
      entities.push({ type: 'code', value: match[0], start: match.index, end: match.index + match[0].length });
    }
    
    return entities;
  }
  
  // 提取动作
  private extractAction(text: string, intent: IntentType): string | undefined {
    const actionWords: Record<string, string> = {
      '做': 'do', '完成': 'complete', '处理': 'process',
      '查看': 'view', '找': 'find', '搜索': 'search',
      '创建': 'create', '新建': 'create', '删除': 'delete',
      '修改': 'update', '执行': 'execute', '运行': 'run',
    };
    
    for (const [word, action] of Object.entries(actionWords)) {
      if (text.includes(word)) return action;
    }
    
    return undefined;
  }
  
  // 提取槽位
  private extractSlots(text: string): Record<string, unknown> {
    const words = text.split(/\s+/).filter(w => w.length >= 2);
    return { keywords: words.slice(0, 5) };
  }
  
  // 计算置信度
  private calculateConfidence(text: string, intent: IntentType): number {
    let confidence = 0.5;
    const keywords = INTENT_KEYWORDS[intent] || [];
    const matches = keywords.filter(kw => text.toLowerCase().includes(kw)).length;
    confidence = Math.min(0.95, confidence + matches * 0.15);
    if (text.includes('?') || text.includes('？')) {
      if (intent === 'question') confidence = Math.min(0.95, confidence + 0.2);
    }
    return confidence;
  }
  
  // 获取意图显示
  getIntentDisplay(intent: Intent): string {
    return `${INTENT_EMOJI[intent.type]} 意图: ${intent.type} (${Math.round(intent.confidence * 100)}%)`;
  }
}

export default InputAnalyzer;
