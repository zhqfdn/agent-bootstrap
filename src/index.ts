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
  
  register(api: unknown) {
    console.log('✅ AgentBootstrap 插件已注册');
  },
};

export default plugin;
