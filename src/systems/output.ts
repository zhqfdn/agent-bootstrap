/**
 * Output System - 完善版输出系统 (TypeScript)
 * 
 * 改进：
 * - 用户偏好适配
 * - 上下文感知回复
 * - 多格式输出
 * - 行动执行器增强
 * - 错误处理与恢复
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// 类型定义
// ============================================================================

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
  needsConfirmation?: boolean;
  confirmPrompt?: string;
}

// 用户偏好
export interface UserPreferences {
  style: OutputStyle;
  detailLevel: 'low' | 'medium' | 'high';
  useEmoji: boolean;
  useMarkdown: boolean;
}

// 执行结果
export interface ExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

// 行动定义
export interface Action {
  name: string;
  description: string;
  params: Record<string, { required: boolean; type: string; description?: string }>;
  execute: (params: Record<string, unknown>) => Promise<ExecutionResult>;
}

// ============================================================================
// 配置
// ============================================================================

interface OutputConfig {
  workspaceDir: string;
  preferencesFile: string;
}

function getConfig(workspaceDir?: string): OutputConfig {
  const wsDir = workspaceDir || path.join(os.homedir(), '.openclaw', 'workspace');
  return {
    workspaceDir: wsDir,
    preferencesFile: path.join(wsDir, 'memory', 'output_preferences.json'),
  };
}

// ============================================================================
// 回复模板
// ============================================================================

const STYLE_TEMPLATES: Record<OutputStyle, Record<string, (params: Record<string, string>) => string>> = {
  direct: {
    greeting: (p) => p.name ? `你好，${p.name}` : '你好',
    result: (p) => p.content,
    error: (p) => `错误: ${p.message}`,
    success: (p) => p.message || '完成',
    confirm: (p) => `${p.question} (是/否)`,
    notFound: (p) => `未找到: ${p.target}`,
    loading: (p) => `处理中...`,
  },
  friendly: {
    greeting: (p) => p.name ? `你好呀，${p.name}！✨` : '你好呀！✨',
    result: (p) => `搞定啦！🎉 ${p.content}`,
    error: (p) => `哎呀，出错了... 😢 ${p.message}`,
    success: (p) => `完成啦！✅ ${p.message || ''}`,
    confirm: (p) => `${p.question} \n请回复「是」或「否」~`,
    notFound: (p) => `没找到「${p.target}」呢... 🔍`,
    loading: (p) => `稍等一下哦... ⏳`,
  },
  formal: {
    greeting: (p) => p.name ? `您好，${p.name}` : '您好',
    result: (p) => `已完成：${p.content}`,
    error: (p) => `错误：${p.message}`,
    success: (p) => `成功：${p.message || '操作完成'}`,
    confirm: (p) => `${p.question}\n\n请确认（是/否）`,
    notFound: (p) => `未找到目标：${p.target}`,
    loading: (p) => '处理中...',
  },
  casual: {
    greeting: (p) => p.name ? `嘿，${p.name}！` : '嘿！',
    result: (p) => `好了～ ${p.content}`,
    error: (p) => `呃... ${p.message}`,
    success: (p) => `OK！${p.message || ''}`,
    confirm: (p) => `${p.question}\n(是/否)`,
    notFound: (p) => `${p.target} 没找到`,
    loading: (p) => '...',
  },
  technical: {
    greeting: (p) => `[System] ${p.name ? `User: ${p.name}` : 'Ready'}`,
    result: (p) => `[Result] ${p.content}`,
    error: (p) => `[Error] ${p.message}`,
    success: (p) => `[Success] ${p.message || 'Done'}`,
    confirm: (p) => `[Confirm] ${p.question}`,
    notFound: (p) => `[Not Found] ${p.target || ''}`,
    loading: (p) => '[Processing...]',
  },
};

// ============================================================================
// 回复生成器
// ============================================================================

class ResponseGenerator {
  private preferences: UserPreferences;
  private config: OutputConfig;
  
  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
    this.preferences = this.loadPreferences();
  }
  
  private loadPreferences(): UserPreferences {
    try {
      if (fs.existsSync(this.config.preferencesFile)) {
        return JSON.parse(fs.readFileSync(this.config.preferencesFile, 'utf-8'));
      }
    } catch {
      // 忽略
    }
    return this.getDefaultPreferences();
  }
  
  private getDefaultPreferences(): UserPreferences {
    return {
      style: 'friendly',
      detailLevel: 'medium',
      useEmoji: true,
      useMarkdown: true,
    };
  }
  
  private savePreferences(): void {
    const dir = path.dirname(this.config.preferencesFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.config.preferencesFile, JSON.stringify(this.preferences, null, 2));
  }
  
  /**
   * 设置用户偏好
   */
  setPreferences(prefs: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
    this.savePreferences();
  }
  
  /**
   * 获取用户偏好
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }
  
  /**
   * 生成回复
   */
  generate(
    content: string,
    templateType: string = 'result',
    style?: OutputStyle,
    params?: Record<string, string>
  ): string {
    const s = style || this.preferences.style;
    const templates = STYLE_TEMPLATES[s] || STYLE_TEMPLATES.friendly;
    const template = templates[templateType] || ((p: Record<string, string>) => p.content || '');
    
    return template({ content, ...params });
  }
  
  /**
   * 格式化内容
   */
  format(content: unknown, format: OutputFormat): string {
    switch (format) {
      case 'json':
        return JSON.stringify(content, null, 2);
      
      case 'table':
        if (Array.isArray(content) && content.length > 0) {
          return this.formatAsTable(content);
        }
        return String(content);
      
      case 'list':
        if (Array.isArray(content)) {
          return content.map((item, i) => `${i + 1}. ${item}`).join('\n');
        }
        return String(content);
      
      case 'code':
        const code = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        return `\`\`\`\n${code}\n\`\`\``;
      
      case 'markdown':
        return this.formatAsMarkdown(content);
      
      default:
        return String(content);
    }
  }
  
  private formatAsTable(data: unknown[]): string {
    if (!Array.isArray(data)) return String(data);
    if (data.length === 0) return '空';
    
    const rows = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return Object.values(item).map(v => String(v));
      }
      return [String(item)];
    });
    
    const colWidths: number[] = [];
    for (const row of rows) {
      row.forEach((cell, i) => {
        colWidths[i] = Math.max(colWidths[i] || 0, cell.length);
      });
    }
    
    return rows.map(row => 
      '| ' + row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ') + ' |'
    ).join('\n');
  }
  
  private formatAsMarkdown(content: unknown): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(item => `- ${typeof item === 'object' ? JSON.stringify(item) : item}`).join('\n');
    }
    if (typeof content === 'object' && content !== null) {
      return Object.entries(content)
        .map(([k, v]) => `**${k}**: ${v}`)
        .join('\n');
    }
    return String(content);
  }
}

// ============================================================================
// 行动执行器
// ============================================================================

class ActionExecutor {
  private actions: Map<string, Action> = new Map();
  
  constructor() {
    this.registerDefaultActions();
  }
  
  private registerDefaultActions(): void {
    // 文件读取
    this.register({
      name: 'file.read',
      description: '读取文件内容',
      params: { path: { required: true, type: 'string', description: '文件路径' } },
      execute: async (params) => {
        const filePath = params.path as string;
        if (!filePath) return { success: false, error: '缺少文件路径' };
        
        try {
          if (!fs.existsSync(filePath)) {
            return { success: false, error: '文件不存在' };
          }
          const content = fs.readFileSync(filePath, 'utf-8');
          return { success: true, data: content };
        } catch (e) {
          return { success: false, error: String(e) };
        }
      },
    });
    
    // 文件写入
    this.register({
      name: 'file.write',
      description: '写入文件',
      params: { 
        path: { required: true, type: 'string', description: '文件路径' },
        content: { required: true, type: 'string', description: '文件内容' },
      },
      execute: async (params) => {
        const filePath = params.path as string;
        const content = params.content as string;
        
        if (!filePath) return { success: false, error: '缺少文件路径' };
        
        try {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, content || '', 'utf-8');
          return { success: true, message: '文件已写入' };
        } catch (e) {
          return { success: false, error: String(e) };
        }
      },
    });
    
    // 文件删除
    this.register({
      name: 'file.delete',
      description: '删除文件',
      params: { path: { required: true, type: 'string', description: '文件路径' } },
      execute: async (params) => {
        const filePath = params.path as string;
        if (!filePath) return { success: false, error: '缺少文件路径' };
        
        try {
          if (!fs.existsSync(filePath)) {
            return { success: false, error: '文件不存在' };
          }
          fs.unlinkSync(filePath);
          return { success: true, message: '文件已删除' };
        } catch (e) {
          return { success: false, error: String(e) };
        }
      },
    });
    
    // 目录列表
    this.register({
      name: 'dir.list',
      description: '列出目录内容',
      params: { path: { required: false, type: 'string', description: '目录路径' } },
      execute: async (params) => {
        const dirPath = params.path as string || os.homedir();
        
        try {
          const items = fs.readdirSync(dirPath);
          return { success: true, data: items };
        } catch (e) {
          return { success: false, error: String(e) };
        }
      },
    });
  }
  
  /**
   * 注册行动
   */
  register(action: Action): void {
    this.actions.set(action.name, action);
  }
  
  /**
   * 执行行动
   */
  async execute(actionName: string, params: Record<string, unknown> = {}): Promise<ExecutionResult> {
    const action = this.actions.get(actionName);
    if (!action) {
      return { success: false, error: `未知行动: ${actionName}` };
    }
    
    // 验证必填参数
    for (const [paramName, schema] of Object.entries(action.params)) {
      if (schema.required && !params[paramName]) {
        return { success: false, error: `缺少必填参数: ${paramName}` };
      }
    }
    
    try {
      return await action.execute(params);
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }
  
  /**
   * 获取可用行动
   */
  getAvailableActions(): Action[] {
    return Array.from(this.actions.values());
  }
}

// ============================================================================
// 输出系统主类
// ============================================================================

export class OutputSystem {
  private config: OutputConfig;
  private generator: ResponseGenerator;
  private executor: ActionExecutor;
  
  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
    this.generator = new ResponseGenerator(workspaceDir);
    this.executor = new ActionExecutor();
  }
  
  // ==================== 生成回复 ====================
  
  /**
   * 生成回复内容
   */
  generate(
    content: string,
    options?: {
      style?: OutputStyle;
      format?: OutputFormat;
      template?: string;
      params?: Record<string, string>;
    }
  ): OutputContent {
    const style = options?.style || this.generator.getPreferences().style;
    const format = options?.format || 'text';
    const template = options?.template || 'result';
    const params = options?.params || {};
    
    // 格式化内容
    let formattedContent = content;
    if (format !== 'text') {
      try {
        const parsed = JSON.parse(content);
        formattedContent = this.generator.format(parsed, format);
      } catch {
        formattedContent = this.generator.format(content, format);
      }
    }
    
    // 应用模板
    const text = this.generator.generate(formattedContent, template, style, params);
    
    return {
      format,
      style,
      content: text,
      metadata: {
        style,
        format,
        timestamp: new Date().toISOString(),
      },
    };
  }
  
  /**
   * 生成错误回复
   */
  error(message: string, style?: OutputStyle): OutputContent {
    return this.generate(message, { style, template: 'error' });
  }
  
  /**
   * 生成成功回复
   */
  success(message: string, style?: OutputStyle): OutputContent {
    return this.generate(message, { style, template: 'success' });
  }
  
  /**
   * 生成确认提示
   */
  confirm(question: string, style?: OutputStyle): OutputContent {
    return {
      format: 'text',
      style: style || this.generator.getPreferences().style,
      content: this.generator.generate('', 'confirm', style, { question }),
      metadata: { timestamp: new Date().toISOString() },
      needsConfirmation: true,
      confirmPrompt: question,
    };
  }
  
  // ==================== 执行行动 ====================
  
  /**
   * 执行行动
   */
  async execute(action: string, params: Record<string, unknown> = {}): Promise<ExecutionResult> {
    return this.executor.execute(action, params);
  }
  
  /**
   * 注册自定义行动
   */
  registerAction(action: Action): void {
    this.executor.register(action);
  }
  
  /**
   * 获取可用行动
   */
  getAvailableActions(): Action[] {
    return this.executor.getAvailableActions();
  }
  
  // ==================== 偏好管理 ====================
  
  /**
   * 设置用户偏好
   */
  setPreferences(prefs: Partial<UserPreferences>): void {
    this.generator.setPreferences(prefs);
  }
  
  /**
   * 获取用户偏好
   */
  getPreferences(): UserPreferences {
    return this.generator.getPreferences();
  }
  
  // ==================== 格式化 ====================
  
  /**
   * 格式化结果
   */
  formatResult(result: unknown, format: OutputFormat = 'text'): string {
    return this.generator.format(result, format);
  }
  
  /**
   * 格式化代码
   */
  formatCode(code: string, language: string = ''): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }
  
  /**
   * 格式化列表
   */
  formatList(items: string[], numbered: boolean = false): string {
    return items.map((item, i) => numbered ? `${i + 1}. ${item}` : `• ${item}`).join('\n');
  }
  
  // ==================== 状态 ====================
  
  /**
   * 获取状态
   */
  getStatus(): {
    preferences: UserPreferences;
    availableActions: string[];
  } {
    return {
      preferences: this.generator.getPreferences(),
      availableActions: this.executor.getAvailableActions().map(a => a.name),
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

export function createOutputSystem(workspaceDir?: string): OutputSystem {
  return new OutputSystem(workspaceDir);
}

export default OutputSystem;
