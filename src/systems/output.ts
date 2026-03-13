/**
 * Output System - 输出系统 (TypeScript 版)
 * 回复生成与行动执行
 */

// 输出格式
export type OutputFormat = 'text' | 'markdown' | 'code' | 'json' | 'table' | 'list';

// 输出风格
export type OutputStyle = 'direct' | 'friendly' | 'formal' | 'casual' | 'technical';

// 输出内容
export interface OutputContent {
  format: OutputFormat;
  style: OutputStyle;
  content: string;
  metadata: Record<string, unknown>;
}

// 回复模板
const RESPONSE_TEMPLATES: Record<OutputStyle, Record<string, string>> = {
  direct: {
    greeting: '{greeting}',
    result: '{result}',
    error: '错误: {error}',
    confirm: '完成',
  },
  friendly: {
    greeting: '你好呀！{greeting}',
    result: '搞定啦！{result}',
    error: '哎呀，出错了... {error}',
    confirm: '好的，已经完成了～',
  },
  formal: {
    greeting: '您好。{greeting}',
    result: '已完成：{result}',
    error: '错误：{error}',
    confirm: '已确认',
  },
  casual: {
    greeting: '嘿！{greeting}',
    result: '好了～ {result}',
    error: '呃... {error}',
    confirm: 'OK！',
  },
  technical: {
    greeting: '[System] {greeting}',
    result: '[Result] {result}',
    error: '[Error] {error}',
    confirm: '[Confirmed]',
  },
};

// 回复生成器
export class ResponseGenerator {
  // 生成回复
  generate(content: string, style: OutputStyle = 'friendly', templateType: string = 'result'): string {
    const templates = RESPONSE_TEMPLATES[style] || RESPONSE_TEMPLATES.friendly;
    const template = templates[templateType] || '{content}';
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      if (key === 'content') return content;
      return content; // 默认返回内容
    });
  }
  
  // 格式化代码
  formatCode(code: string, language: string = ''): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }
  
  // 格式化列表
  formatList(items: string[], numbered: boolean = false): string {
    return items.map((item, i) => numbered ? `${i + 1}. ${item}` : `• ${item}`).join('\n');
  }
  
  // 格式化表格
  formatTable(headers: string[], rows: string[][]): string {
    const colWidths = headers.map((h, i) => 
      Math.max(h.length, ...rows.map(r => (r[i] || '').length))
    );
    
    const formatRow = (cells: string[]) => 
      '| ' + cells.map((c, i) => c.padEnd(colWidths[i])).join(' | ') + ' |';
    
    return [
      formatRow(headers),
      '|-' + colWidths.map(w => '-'.repeat(w)).join('-|-') + '-|',
      ...rows.map(formatRow),
    ].join('\n');
  }
}

// 行动执行器
export class ActionExecutor {
  private executors: Record<string, (params: Record<string, unknown>) => { success: boolean; error?: string; data?: unknown }> = {};
  
  constructor() {
    this.registerDefaultExecutors();
  }
  
  private registerDefaultExecutors(): void {
    // 文件操作
    this.executors['file.write'] = this.fileWrite.bind(this);
    this.executors['file.read'] = this.fileRead.bind(this);
    this.executors['file.delete'] = this.fileDelete.bind(this);
  }
  
  private fileWrite(params: Record<string, unknown>): { success: boolean; error?: string } {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = params.path as string;
    const content = params.content as string;
    
    if (!filePath) return { success: false, error: '缺少路径' };
    
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content || '');
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: String(e) };
    }
  }
  
  private fileRead(params: Record<string, unknown>): { success: boolean; error?: string; data?: string } {
    const fs = require('fs');
    
    const filePath = params.path as string;
    if (!filePath) return { success: false, error: '缺少路径' };
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: content };
    } catch (e: unknown) {
      return { success: false, error: String(e) };
    }
  }
  
  private fileDelete(params: Record<string, unknown>): { success: boolean; error?: string } {
    const fs = require('fs');
    
    const filePath = params.path as string;
    if (!filePath) return { success: false, error: '缺少路径' };
    
    try {
      fs.unlinkSync(filePath);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: String(e) };
    }
  }
  
  // 注册执行器
  register(name: string, fn: (params: Record<string, unknown>) => { success: boolean; error?: string; data?: unknown }): void {
    this.executors[name] = fn;
  }
  
  // 执行行动
  execute(action: string, params: Record<string, unknown> = {}): { success: boolean; error?: string; data?: unknown } {
    const executor = this.executors[action];
    if (!executor) {
      return { success: false, error: `未知行动: ${action}` };
    }
    return executor(params);
  }
  
  // 获取可用行动
  getAvailableActions(): string[] {
    return Object.keys(this.executors);
  }
}

// 输出系统主类
export class OutputSystem {
  private generator: ResponseGenerator;
  private executor: ActionExecutor;
  private defaultStyle: OutputStyle;
  private defaultFormat: OutputFormat;
  
  constructor() {
    this.generator = new ResponseGenerator();
    this.executor = new ActionExecutor();
    this.defaultStyle = 'friendly';
    this.defaultFormat = 'text';
  }
  
  // 生成回复
  generateResponse(
    content: string,
    style?: OutputStyle,
    format?: OutputFormat,
    templateType?: string
  ): OutputContent {
    const s = style || this.defaultStyle;
    const f = format || this.defaultFormat;
    
    let formattedContent = content;
    
    if (f === 'code') {
      formattedContent = this.generator.formatCode(content);
    }
    
    const text = this.generator.generate(formattedContent, s, templateType || 'result');
    
    return {
      format: f,
      style: s,
      content: text,
      metadata: {
        style: s,
        format: f,
        timestamp: new Date().toISOString(),
      },
    };
  }
  
  // 执行行动
  executeAction(action: string, params: Record<string, unknown> = {}): { success: boolean; error?: string; data?: unknown } {
    return this.executor.execute(action, params);
  }
  
  // 格式化结果
  formatResult(result: unknown, format: OutputFormat = 'text'): string {
    if (format === 'json') {
      return JSON.stringify(result, null, 2);
    }
    
    if (typeof result === 'object' && result !== null) {
      const entries = Object.entries(result);
      return entries.map(([k, v]) => `**${k}**: ${v}`).join('\n');
    }
    
    if (Array.isArray(result)) {
      return this.generator.formatList(result.map(String));
    }
    
    return String(result);
  }
  
  // 创建确认提示
  createConfirmationPrompt(question: string): string {
    return `${question}\n\n请回复「是」或「否」`;
  }
  
  // 创建澄清提示
  createClarificationPrompt(question: string, options?: string[]): string {
    if (options) {
      return `${question}\n\n选项: ${options.join(' | ')}`;
    }
    return question;
  }
  
  // 获取状态
  getStatus(): { defaultStyle: OutputStyle; defaultFormat: OutputFormat; availableActions: string[] } {
    return {
      defaultStyle: this.defaultStyle,
      defaultFormat: this.defaultFormat,
      availableActions: this.executor.getAvailableActions(),
    };
  }
  
  // 设置默认风格
  setDefaultStyle(style: OutputStyle): void {
    this.defaultStyle = style;
  }
  
  // 设置默认格式
  setDefaultFormat(format: OutputFormat): void {
    this.defaultFormat = format;
  }
}

export default OutputSystem;
