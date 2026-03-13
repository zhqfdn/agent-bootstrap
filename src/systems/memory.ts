/**
 * Memory System - TypeScript 实现
 * 记忆系统：存储、加载、索引、遗忘
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import crypto from 'crypto';

// ============================================================================
// 类型定义
// ============================================================================

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'self';
export type PrivacyLevel = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  tags: string[];
  emotion: number;
  privacy: PrivacyLevel;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  byPrivacy: Record<PrivacyLevel, number>;
}

export interface UserPreferences {
  communication_style?: string;
  problem_approach?: string;
  uncertainty_handling?: string;
  [key: string]: unknown;
}

export interface Identity {
  name?: string;
  role?: string;
  created_at?: string;
  [key: string]: unknown;
}

// ============================================================================
// 配置
// ============================================================================

export interface MemoryConfig {
  workspaceDir: string;
  memoryDir: string;
  dailyDir: string;
  longtermDir: string;
  archiveDir: string;
  emotionDir: string;
}

function getConfig(workspaceDir?: string): MemoryConfig {
  const wsDir = workspaceDir || path.join(os.homedir(), '.openclaw', 'workspace');
  return {
    workspaceDir: wsDir,
    memoryDir: path.join(wsDir, 'memory'),
    dailyDir: path.join(wsDir, 'memory', 'daily'),
    longtermDir: path.join(wsDir, 'memory', 'longterm'),
    archiveDir: path.join(wsDir, 'memory', 'archive'),
    emotionDir: path.join(wsDir, 'memory', 'emotions'),
  };
}

// ============================================================================
// 工具函数
// ============================================================================

function generateId(): string {
  return crypto.randomUUID();
}

function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ============================================================================
// MemoryStore - 存储
// ============================================================================

export class MemoryStore {
  private config: MemoryConfig;

  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
    this.init();
  }

  private init(): void {
    ensureDir(this.config.dailyDir);
    ensureDir(this.config.longtermDir);
    ensureDir(this.config.archiveDir);
    ensureDir(this.config.emotionDir);
  }

  save(memory: Omit<Memory, 'id' | 'timestamp'>): string {
    const id = generateId();
    const fullMemory: Memory = {
      ...memory,
      id,
      timestamp: new Date().toISOString(),
    };

    const date = formatDate();
    const filePath = path.join(this.config.dailyDir, `${date}.md`);
    
    let content = '';
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf-8');
    }

    // 追加记忆到文件
    const newEntry = this.formatMemoryEntry(fullMemory);
    content += newEntry + '\n\n';
    
    fs.writeFileSync(filePath, content, 'utf-8');
    
    return id;
  }

  private formatMemoryEntry(memory: Memory): string {
    let entry = `## ${memory.timestamp}\n\n`;
    entry += `- **内容**: ${memory.content}\n`;
    entry += `- **类型**: ${memory.type}\n`;
    entry += `- **标签**: ${memory.tags.join(', ') || '无'}\n`;
    entry += `- **情感**: ${memory.emotion}\n`;
    entry += `- **隐私**: ${memory.privacy}\n`;
    if (memory.metadata) {
      entry += `- **元数据**: ${JSON.stringify(memory.metadata)}\n`;
    }
    return entry;
  }

  savePreferences(prefs: UserPreferences): void {
    const filePath = path.join(this.config.memoryDir, 'learned_preferences.json');
    fs.writeFileSync(filePath, JSON.stringify(prefs, null, 2), 'utf-8');
  }

  loadPreferences(): UserPreferences {
    const filePath = path.join(this.config.memoryDir, 'learned_preferences.json');
    if (!fs.existsSync(filePath)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return {};
    }
  }

  saveIdentity(identity: Identity): void {
    const filePath = path.join(this.config.workspaceDir, 'IDENTITY.md');
    const content = this.formatYaml(identity);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  loadIdentity(): Identity {
    const filePath = path.join(this.config.workspaceDir, 'IDENTITY.md');
    if (!fs.existsSync(filePath)) {
      return {};
    }
    // 简单解析 YAML 格式
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parseYaml(content);
  }

  private formatYaml(obj: Record<string, unknown>): string {
    let yaml = '# IDENTITY.md\n';
    for (const [key, value] of Object.entries(obj)) {
      yaml += `${key}: ${JSON.stringify(value)}\n`;
    }
    return yaml;
  }

  private parseYaml(content: string): Identity {
    const identity: Identity = {};
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        try {
          identity[key] = JSON.parse(value);
        } catch {
          identity[key] = value.trim();
        }
      }
    }
    return identity;
  }
}

// ============================================================================
// MemoryLoader - 加载
// ============================================================================

export class MemoryLoader {
  private config: MemoryConfig;

  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
  }

  loadTodayMemories(): Memory[] {
    const today = formatDate();
    const filePath = path.join(this.config.dailyDir, `${today}.md`);
    return this.loadFromFile(filePath);
  }

  loadRecentMemories(days: number = 7): Memory[] {
    const memories: Memory[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const filePath = path.join(this.config.dailyDir, `${dateStr}.md`);
      
      const dayMemories = this.loadFromFile(filePath);
      memories.push(...dayMemories);
    }
    
    return memories;
  }

  private loadFromFile(filePath: string): Memory[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    // 简单解析 Markdown 文件
    const content = fs.readFileSync(filePath, 'utf-8');
    const memories: Memory[] = [];
    
    const entries = content.split(/^## /m).filter(e => e.trim());
    
    for (const entry of entries) {
      const lines = entry.split('\n');
      const memory: Partial<Memory> = {
        id: '',
        content: '',
        type: 'episodic',
        tags: [],
        emotion: 0.5,
        privacy: 'P3',
        timestamp: '',
      };
      
      for (const line of lines) {
        if (line.includes('**内容**:')) {
          memory.content = line.replace(/.*\*\*内容\*\*:\s*/, '').trim();
        } else if (line.includes('**类型**:')) {
          memory.type = line.replace(/.*\*\*类型\*\*:\s*/, '').trim() as MemoryType;
        } else if (line.includes('**标签**:')) {
          const tagsStr = line.replace(/.*\*\*标签\*\*:\s*/, '').replace('无', '').trim();
          memory.tags = tagsStr ? tagsStr.split(', ').filter(t => t) : [];
        } else if (line.includes('**情感**:')) {
          memory.emotion = parseFloat(line.replace(/.*\*\*情感\*\*:\s*/, '').trim()) || 0.5;
        } else if (line.includes('**隐私**:')) {
          memory.privacy = line.replace(/.*\*\*隐私\*\*:\s*/, '').trim() as PrivacyLevel;
        } else if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
          memory.timestamp = line.trim();
          memory.id = generateId();
        }
      }
      
      if (memory.content && memory.timestamp) {
        memories.push(memory as Memory);
      }
    }
    
    return memories;
  }

  loadPrefrences(): UserPreferences {
    const store = new MemoryStore(this.config.workspaceDir);
    return store.loadPreferences();
  }

  getStats(): MemoryStats {
    const memories = this.loadRecentMemories(30);
    const stats: MemoryStats = {
      total: memories.length,
      byType: { episodic: 0, semantic: 0, procedural: 0, self: 0 },
      byPrivacy: { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 },
    };
    
    for (const m of memories) {
      stats.byType[m.type]++;
      stats.byPrivacy[m.privacy]++;
    }
    
    return stats;
  }
}

// ============================================================================
// MemoryForgetting - 遗忘
// ============================================================================

export class MemoryForgetting {
  private config: MemoryConfig;

  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
  }

  forgetMemory(memoryId: string, date: string): boolean {
    // 简单实现：标记为遗忘（不真正删除）
    console.log(`[memory] Forgetting memory ${memoryId} from ${date}`);
    return true;
  }

  runAutoCleanup(): { deleted: number; archived: number } {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    let deleted = 0;
    let archived = 0;
    
    // 清理超过90天的记忆
    if (fs.existsSync(this.config.dailyDir)) {
      const files = fs.readdirSync(this.config.dailyDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const filePath = path.join(this.config.dailyDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.mtimeMs < thirtyDaysAgo) {
          // 移动到归档
          const archivePath = path.join(this.config.archiveDir, file);
          fs.renameSync(filePath, archivePath);
          archived++;
        }
      }
    }
    
    return { deleted, archived };
  }

  getForgettingStats(): { pending: number; archived: number } {
    let pending = 0;
    let archived = 0;
    
    if (fs.existsSync(this.config.dailyDir)) {
      pending = fs.readdirSync(this.config.dailyDir).filter(f => f.endsWith('.md')).length;
    }
    if (fs.existsSync(this.config.archiveDir)) {
      archived = fs.readdirSync(this.config.archiveDir).filter(f => f.endsWith('.md')).length;
    }
    
    return { pending, archived };
  }
}

// ============================================================================
// MemorySystem - 统一 API
// ============================================================================

export class MemorySystem {
  private store: MemoryStore;
  private loader: MemoryLoader;
  private forgetting: MemoryForgetting;

  constructor(workspaceDir?: string) {
    this.store = new MemoryStore(workspaceDir);
    this.loader = new MemoryLoader(workspaceDir);
    this.forgetting = new MemoryForgetting(workspaceDir);
  }

  // 存储操作
  save(content: string, options?: {
    type?: MemoryType;
    tags?: string[];
    emotion?: number;
    privacy?: PrivacyLevel;
    metadata?: Record<string, unknown>;
  }): string {
    return this.store.save({
      content,
      type: options?.type || 'episodic',
      tags: options?.tags || [],
      emotion: options?.emotion || 0.5,
      privacy: options?.privacy || 'P3',
      metadata: options?.metadata,
    });
  }

  savePreferences(prefs: UserPreferences): void {
    this.store.savePreferences(prefs);
  }

  saveIdentity(identity: Identity): void {
    this.store.saveIdentity(identity);
  }

  // 读取操作
  getToday(): Memory[] {
    return this.loader.loadTodayMemories();
  }

  getRecent(days: number = 7): Memory[] {
    return this.loader.loadRecentMemories(days);
  }

  getPreferences(): UserPreferences {
    return this.loader.loadPrefrences();
  }

  getLongterm(): Memory[] {
    // TODO: 实现长期记忆加载
    return [];
  }

  // 搜索
  search(keyword: string): Memory[] {
    const recent = this.getRecent(30);
    return recent.filter(m => 
      m.content.toLowerCase().includes(keyword.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase()))
    );
  }

  // 统计
  stats(): MemoryStats {
    return this.loader.getStats();
  }

  // 清理
  cleanup(): { deleted: number; archived: number } {
    return this.forgetting.runAutoCleanup();
  }

  // 快速记住
  rememberThis(content: string, important: boolean = false): string {
    return this.save(content, {
      emotion: important ? 0.9 : 0.5,
      tags: important ? ['重要'] : [],
    });
  }

  // 询问记忆
  whatDoYouRemember(about?: string): string {
    if (about) {
      const results = this.search(about);
      if (results.length === 0) {
        return `关于「${about}」，我没有相关记忆`;
      }
      return `关于「${about}」，我记得：\n` + 
        results.slice(0, 5).map(r => `- ${r.content}`).join('\n');
    }
    
    const recent = this.getRecent(3);
    if (recent.length === 0) {
      return '我最近没有记忆';
    }
    return '我最近记得：\n' + 
      recent.slice(0, 5).map(m => `- ${m.content}`).join('\n');
  }
}

// ============================================================================
// 导出
// ============================================================================

export function createMemorySystem(workspaceDir?: string): MemorySystem {
  return new MemorySystem(workspaceDir);
}

export default MemorySystem;
