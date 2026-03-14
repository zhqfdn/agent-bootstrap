/**
 * AgentBootstrap - OpenClaw Agent 插件
 * 完整的 Agent 核心系统
 */

import * as fs from 'fs';
import * as path from 'path';

// 导出各个系统
export { EmotionSystem, MoodType, EmotionState, EmotionConfig, DEFAULT_CONFIG as EMOTION_CONFIG } from './systems/emotion';
export { InputSystem, Intent, IntentType, Entity, Emotion } from './systems/input';
export { BootstrapEngine, BootstrapState } from './systems/bootstrap';
export { CognitionSystem, Task, Decision, UserPreferences } from './systems/cognition';
export { OutputSystem, OutputContent, OutputFormat, OutputStyle } from './systems/output';

export interface PluginConfig {
  autoStart: boolean;
  emotionEnabled: boolean;
  memoryEnabled: boolean;
  bootstrapEnabled: boolean;
  autoBootstrap: boolean;
  forceOverwrite?: boolean;
  backupExisting?: boolean;
}

export const DEFAULT_CONFIG: PluginConfig = {
  autoStart: true,
  emotionEnabled: true,
  memoryEnabled: true,
  bootstrapEnabled: true,
  autoBootstrap: true,
  forceOverwrite: false,
  backupExisting: true,
};

const CRITICAL_PATHS = [
  'memory',
  'hooks',
  'templates',
  'bootstrap_state.json',
  'IDENTITY.md',
  'USER.md',
  'SOUL.md',
  'MEMORY.md',
];

export interface InstallResult {
  success: boolean;
  warnings: string[];
  conflicts: string[];
  backups: string[];
}

export function detectConflicts(workspaceDir: string): string[] {
  const conflicts: string[] = [];
  for (const item of CRITICAL_PATHS) {
    const fullPath = path.join(workspaceDir, item);
    if (fs.existsSync(fullPath)) {
      conflicts.push(item);
    }
  }
  return conflicts;
}

export function backupExisting(workspaceDir: string): string[] {
  const backups: string[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(workspaceDir, `.agent-bootstrap-backup-${timestamp}`);
  
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    for (const item of CRITICAL_PATHS) {
      const fullPath = path.join(workspaceDir, item);
      if (fs.existsSync(fullPath)) {
        const destPath = path.join(backupDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          fs.cpSync(fullPath, destPath, { recursive: true });
        } else {
          fs.copyFileSync(fullPath, destPath);
        }
        backups.push(item);
      }
    }
  } catch (error) {
    console.error('Backup failed:', error);
  }
  return backups;
}

export function preInstallCheck(
  workspaceDir: string,
  config: PluginConfig
): { canInstall: boolean; result: InstallResult } {
  const result: InstallResult = {
    success: true,
    warnings: [],
    conflicts: [],
    backups: [],
  };
  
  const conflicts = detectConflicts(workspaceDir);
  result.conflicts = conflicts;
  
  if (conflicts.length > 0) {
    if (config.forceOverwrite) {
      if (config.backupExisting) {
        result.backups = backupExisting(workspaceDir);
      }
    } else {
      result.success = false;
    }
  }
  
  return { canInstall: result.success, result };
}

// ============================================================================
// Context Engine 实现
// ============================================================================

export interface ContextEngineParams {
  messages: unknown[];
  sessionId: string;
  sessionFile?: string;
  runtimeContext?: Record<string, unknown>;
  tokenBudget?: number;
  force?: boolean;
  customInstructions?: string;
  workspaceDir?: string;
}

export interface ContextEngineResult {
  messages: unknown[];
  estimatedTokens: number;
}

export interface CompactResult {
  ok: boolean;
  compacted: boolean;
  reason: string;
  result?: {
    summary: string;
    firstKeptEntryId: string;
    tokensBefore: number;
    tokensAfter: number;
    details: unknown[];
  };
}

class AgentBootstrapContextEngine {
  info = {
    id: 'agent-bootstrap',
    name: 'Agent Bootstrap Context Engine',
    version: '0.0.4',
  };

  private workspaceDir: string = '';
  private initialized: boolean = false;

  async ingest(params: ContextEngineParams): Promise<{ ingested: boolean }> {
    // 从 runtimeContext 获取 workspaceDir
    if (params.runtimeContext?.workspaceDir) {
      this.workspaceDir = params.runtimeContext.workspaceDir as string;
    }
    
    this.initialized = true;
    return { ingested: true };
  }

  async assemble(params: ContextEngineParams): Promise<ContextEngineResult> {
    const messages = params.messages ?? [];
    
    // 估算 token（简单估算：每4个字符约1个token）
    let estimatedTokens = 0;
    for (const msg of messages) {
      if (msg && typeof msg === 'object') {
        const m = msg as { content?: string };
        if (m.content && typeof m.content === 'string') {
          estimatedTokens += Math.ceil(m.content.length / 4);
        }
      }
    }
    
    // 尝试加载引导上下文文件
    let bootstrapMessages: object[] = [];
    if (this.workspaceDir) {
      const bootstrapFiles = ['BOOTSTRAP.md', 'SOUL.md', 'IDENTITY.md', 'USER.md'];
      for (const file of bootstrapFiles) {
        const filePath = path.join(this.workspaceDir, file);
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            bootstrapMessages.push({
              role: 'system',
              content: `[${file}]\n${content}`,
            });
          } catch (e) {
            // 忽略读取错误
          }
        }
      }
    }
    
    // 将引导消息放在最前面
    const allMessages = [
      ...bootstrapMessages,
      ...messages,
    ];
    
    return {
      messages: allMessages,
      estimatedTokens,
    };
  }

  async afterTurn(_params: ContextEngineParams): Promise<void> {
    // 可以在这里处理每轮结束后的逻辑
    // 例如保存状态、更新记忆等
  }

  async compact(params: ContextEngineParams): Promise<CompactResult> {
    // 简单的压缩实现：保留系统消息和最近的消息
    const maxMessages = 10;
    const messages = (params.messages ?? []) as Array<{ role?: string; content?: string }>;
    
    if (messages.length <= maxMessages) {
      return {
        ok: true,
        compacted: false,
        reason: 'Message count within limit',
      };
    }
    
    // 保留系统消息和最近的消息
    const systemMessages = messages.filter(
      (m) => m && m.role === 'system'
    );
    const recentMessages = messages.slice(-maxMessages);
    
    // 计算压缩前后的 token 数
    const tokensBefore = messages.reduce((acc: number, m) => {
      if (m.content && typeof m.content === 'string') {
        return acc + Math.ceil(m.content.length / 4);
      }
      return acc;
    }, 0);
    
    const tokensAfter = recentMessages.reduce((acc: number, m) => {
      if (m.content && typeof m.content === 'string') {
        return acc + Math.ceil(m.content.length / 4);
      }
      return acc;
    }, 0);
    
    const compactedMessages = [...systemMessages, ...recentMessages];
    
    return {
      ok: true,
      compacted: true,
      reason: `Compacted from ${messages.length} to ${compactedMessages.length} messages`,
      result: {
        summary: `Compacted messages: kept ${systemMessages.length} system messages and ${recentMessages.length} recent messages`,
        firstKeptEntryId: 'system',
        tokensBefore,
        tokensAfter,
        details: ['Message compaction completed'],
      },
    };
  }

  async dispose(): Promise<void> {
    this.workspaceDir = '';
    this.initialized = false;
  }
}

// 导出 contextEngine 实例
export const contextEngine = new AgentBootstrapContextEngine();

// ============================================================================
// Plugin 定义
// ============================================================================

/**
 * 自动配置 bootstrap-extra-files hook
 * 读取 openclaw.plugin.json 中的 agentTemplates 配置
 * 并将模板路径添加到 openclaw.json
 */
async function configureBootstrapExtraFiles(): Promise<void> {
  const pluginDir = path.dirname(__dirname);
  const pluginJsonPath = path.join(pluginDir, 'openclaw.plugin.json');
  const openclawConfigPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json');
  
  try {
    // 读取插件配置
    if (!fs.existsSync(pluginJsonPath)) {
      console.log('⚠️ openclaw.plugin.json 不存在，跳过 bootstrap-extra-files 配置');
      return;
    }
    
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));
    
    if (!pluginJson.agentTemplates) {
      console.log('⚠️ 未找到 agentTemplates 配置，跳过');
      return;
    }
    
    const { path: templatePath, files } = pluginJson.agentTemplates;
    
    if (!templatePath || !files || !Array.isArray(files)) {
      console.log('⚠️ agentTemplates 配置格式不正确，跳过');
      return;
    }
    
    // 构建完整路径
    const templateDir = path.join(pluginDir, templatePath);
    const paths: string[] = [];
    
    for (const file of files) {
      const fullPath = path.join(templateDir, file);
      if (fs.existsSync(fullPath)) {
        paths.push(fullPath);
        console.log(`✅ 找到模板: ${file}`);
      } else {
        console.log(`⚠️ 模板文件不存在: ${file}`);
      }
    }
    
    if (paths.length === 0) {
      console.log('❌ 没有找到任何模板文件');
      return;
    }
    
    // 读取 openclaw.json
    if (!fs.existsSync(openclawConfigPath)) {
      console.log('⚠️ openclaw.json 不存在，跳过配置');
      return;
    }
    
    const openclawConfig = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf-8'));
    
    // 初始化 hooks 结构
    if (!openclawConfig.hooks) {
      openclawConfig.hooks = {};
    }
    if (!openclawConfig.hooks.internal) {
      openclawConfig.hooks.internal = {};
    }
    if (!openclawConfig.hooks.internal.entries) {
      openclawConfig.hooks.internal.entries = {};
    }
    
    // 检查是否已有配置
    if (openclawConfig.hooks.internal.entries['bootstrap-extra-files']) {
      console.log('⚠️ bootstrap-extra-files 已存在配置，将更新');
    }
    
    // 添加/更新 bootstrap-extra-files 配置
    openclawConfig.hooks.internal.entries['bootstrap-extra-files'] = {
      enabled: true,
      paths: paths,
    };
    
    // 写回配置
    fs.writeFileSync(openclawConfigPath, JSON.stringify(openclawConfig, null, 2));
    console.log('✅ bootstrap-extra-files 配置已添加到 openclaw.json');
    
  } catch (error) {
    console.error('❌ 配置 bootstrap-extra-files 失败:', error);
  }
}

// ============================================================================
// 插件状态检测函数
// ============================================================================

/**
 * 检测 hooks 是否已注册
 */
function checkHooksStatus(): { installed: boolean; missing: string[] } {
  const hooksDir = path.join(process.env.HOME || '', '.openclaw', 'hooks');
  const expectedHooks = ['agent-init'];
  const missing: string[] = [];
  
  for (const hook of expectedHooks) {
    const hookPath = path.join(hooksDir, hook);
    if (!fs.existsSync(hookPath)) {
      missing.push(hook);
    }
  }
  
  return {
    installed: missing.length === 0,
    missing
  };
}

/**
 * 检测模板文件是否完整
 */
function checkTemplatesStatus(): { complete: boolean; missing: string[] } {
  const pluginDir = path.dirname(__dirname);
  const templateDir = path.join(pluginDir, 'agent-templates');
  const expectedTemplates = [
    'AGENTS.md',
    'SOUL.md',
    'MEMORY.md',
    'IDENTITY.md',
    'USER.md',
    'TOOLS.md',
    'BOOTSTRAP.md',
    'HEARTBEAT.md'
  ];
  const missing: string[] = [];
  
  for (const template of expectedTemplates) {
    const templatePath = path.join(templateDir, template);
    if (!fs.existsSync(templatePath)) {
      missing.push(template);
    }
  }
  
  return {
    complete: missing.length === 0,
    missing
  };
}

// ============================================================================
// Plugin 定义
// ============================================================================

const plugin = {
  id: 'agent-bootstrap',
  name: '@qcluffy/agent-bootstrap',
  description: 'Complete Agent Core System: Memory, Emotion, Heartbeat, Input, Cognition, Output, Bootstrap',
  version: '0.0.4',
  
  configSchema: {
    type: 'object' as const,
    properties: {
      autoStart: { type: 'boolean', default: true },
      emotionEnabled: { type: 'boolean', default: true },
      memoryEnabled: { type: 'boolean', default: true },
      bootstrapEnabled: { type: 'boolean', default: true },
      autoBootstrap: { type: 'boolean', default: true },
      forceOverwrite: { type: 'boolean', default: false },
      backupExisting: { type: 'boolean', default: true },
    },
  },
  
  async register(api: { registerContextEngine?: (id: string, factory: () => unknown) => void }) {
    // 1. 插件注册
    console.log('✅ agent-bootstrap 插件已注册');
    
    // 2. 检测 hooks 状态
    const hooksStatus = checkHooksStatus();
    if (hooksStatus.installed) {
      console.log('✅ agent-bootstrap Hooks 已注册');
    } else {
      console.log(`⚠️ agent-bootstrap Hooks 未注册，缺失: ${hooksStatus.missing.join(', ')}`);
    }
    
    // 3. 检测模板状态
    const templatesStatus = checkTemplatesStatus();
    if (templatesStatus.complete) {
      console.log('✅ agent-bootstrap Agent模板已加载');
    } else {
      console.log(`⚠️ agent-bootstrap Agent模板加载，部分缺失 (${templatesStatus.missing.join(', ')})`);
    }
    
    // 4. 自动配置 bootstrap-extra-files
    await configureBootstrapExtraFiles();
    
    // 5. 注册 context engine
    if (api && typeof api.registerContextEngine === 'function') {
      api.registerContextEngine('agent-bootstrap', () => new AgentBootstrapContextEngine());
      console.log('✅ agent-bootstrap Context Engine 已注册');
    }
  },
};

export default plugin;
