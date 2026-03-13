/**
 * AgentBootstrap - OpenClaw Agent 插件
 * 完整的 Agent 核心系统
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PluginConfig {
  autoStart: boolean;
  emotionEnabled: boolean;
  memoryEnabled: boolean;
  bootstrapEnabled: boolean;
  autoBootstrap: boolean;
  forceOverwrite?: boolean;  // 是否强制覆盖现有文件
  backupExisting?: boolean;  // 是否备份现有文件
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

// 关键文件/目录
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

// 检测冲突
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

// 备份现有文件
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
        
        // 复制文件或目录
        if (fs.statSync(fullPath).isDirectory()) {
          fs.cpSync(fullPath, destPath, { recursive: true });
        } else {
          fs.copyFileSync(fullPath, destPath);
        }
        
        backups.push(item);
      }
    }
    
    console.log(`✅ 备份已保存到: ${backupDir}`);
  } catch (error) {
    console.error('⚠️ 备份失败:', error);
  }
  
  return backups;
}

// 安装前检查
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
  
  // 检测冲突
  const conflicts = detectConflicts(workspaceDir);
  
  if (conflicts.length > 0) {
    result.conflicts = conflicts;
    
    if (config.forceOverwrite) {
      // 强制覆盖模式
      result.warnings.push(`⚠️ 将覆盖以下现有文件: ${conflicts.join(', ')}`);
      
      if (config.backupExisting) {
        result.backups = backupExisting(workspaceDir);
        result.warnings.push(`✅ 已备份 ${result.backups.length} 个项目`);
      }
    } else {
      // 非强制模式 - 提示用户
      result.success = false;
      result.warnings.push(
        `检测到现有文件: ${conflicts.join(', ')}`,
        '请选择以下选项之一：',
        '1. 设置 forceOverwrite: true 强制覆盖',
        '2. 手动备份后重新安装',
        '3. 使用独立的 workspace 目录测试'
      );
    }
  }
  
  return {
    canInstall: result.success,
    result,
  };
}

// 主插件对象
const plugin = {
  id: 'agent-bootstrap',
  name: 'Agent Bootstrap',
  description: '完整的 Agent 核心系统：记忆、情感、心跳、输入、认知、输出、引导',
  version: '1.0.0',
  
  configSchema: {
    type: 'object' as const,
    properties: {
      autoStart: { type: 'boolean', default: true },
      emotionEnabled: { type: 'boolean', default: true },
      memoryEnabled: { type: 'boolean', default: true },
      bootstrapEnabled: { type: 'boolean', default: true },
      autoBootstrap: { type: 'boolean', default: true },
      forceOverwrite: { type: 'boolean', default: false, description: '是否覆盖现有文件' },
      backupExisting: { type: 'boolean', default: true, description: '安装前是否备份现有文件' },
    },
  },
  
  // 插件安装时调用
  async onInstall(api: { workspaceDir: string }, config: PluginConfig) {
    const workspaceDir = api.workspaceDir || path.join(process.env.HOME || '', '.openclaw/workspace');
    
    console.log('🔍 检查现有安装...');
    
    const check = preInstallCheck(workspaceDir, { ...DEFAULT_CONFIG, ...config });
    
    if (!check.canInstall) {
      console.warn('⚠️ 安装被阻止:', check.result.warnings.join('\n'));
      return { blocked: true, reason: check.result.conflicts };
    }
    
    console.log('✅ 兼容性检查通过');
    return { blocked: false };
  },
  
  // 插件卸载时调用
  async onUninstall(api: { workspaceDir: string }) {
    console.log('🔄 清理插件相关文件...');
    // 清理逻辑
    return { success: true };
  },
  
  register(api: unknown) {
    console.log('✅ AgentBootstrap 插件已注册');
    // 注册各系统
  },
};

export default plugin;
