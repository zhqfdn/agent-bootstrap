/**
 * AgentBootstrap - OpenClaw Agent 插件
 * 完整的 Agent 核心系统
 */

import * as fs from 'fs';
import * as path from 'path';

// 导出各个系统
export { EmotionSystem, MoodType, EmotionState, EmotionConfig, DEFAULT_CONFIG as EMOTION_CONFIG } from './systems/emotion';
export { InputAnalyzer, Intent, IntentType } from './systems/input';
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
    version: '0.0.1',
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

const plugin = {
  id: 'agent-bootstrap',
  name: 'Agent Bootstrap',
  description: '完整的 Agent 核心系统：记忆、情感、心跳、输入、认知、输出、引导',
  version: '0.0.1',
  
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
  
  register(api: { registerContextEngine?: (id: string, factory: () => unknown) => void }) {
    console.log('✅ agent-bootstrap 插件已注册');
    
    // 注册 context engine
    if (api && typeof api.registerContextEngine === 'function') {
      api.registerContextEngine('agent-bootstrap', () => new AgentBootstrapContextEngine());
      console.log('✅ agent-bootstrap Context Engine 已注册');
    }
  },
};

export default plugin;
