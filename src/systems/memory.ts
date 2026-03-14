/**
 * Memory System - 完善版 TypeScript 实现
 * 记忆系统：存储、加载、索引、遗忘
 * 
 * 改进：
 * - JSON Lines 存储格式（更健壮）
 * - 索引文件（快速查询）
 * - 智能遗忘（基于情感+访问频率）
 * - 语义搜索（关键词匹配）
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
  emotion: number;        // 情感强度 0-1
  privacy: PrivacyLevel;
  timestamp: string;
  accessedAt?: string;
  accessCount: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  byPrivacy: Record<PrivacyLevel, number>;
  byDate: Record<string, number>;
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
// 索引结构
// ============================================================================

export interface MemoryIndex {
  version: string;
  lastUpdated: string;
  totalMemories: number;
  byDate: Record<string, string[]>;     // date -> memory IDs
  byType: Record<MemoryType, string[]>;
  byTag: Record<string, string[]>;
  byPrivacy: Record<PrivacyLevel, string[]>;
  importantMemories: string[];           // 高情感记忆 IDs
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
  indexFile: string;
  preferencesFile: string;
}

function getConfig(workspaceDir?: string): MemoryConfig {
  const wsDir = workspaceDir || path.join(os.homedir(), '.openclaw', 'workspace');
  const memDir = path.join(wsDir, 'memory');
  return {
    workspaceDir: wsDir,
    memoryDir: memDir,
    dailyDir: path.join(memDir, 'daily'),
    longtermDir: path.join(memDir, 'longterm'),
    archiveDir: path.join(memDir, 'archive'),
    emotionDir: path.join(memDir, 'emotions'),
    indexFile: path.join(memDir, '.index.json'),
    preferencesFile: path.join(memDir, 'preferences.json'),
  };
}

// ============================================================================
// 工具函数
// ============================================================================

function generateId(): string {
  return crypto.randomUUID().split('-')[0]; // 短 ID
}

function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getDateFromTimestamp(timestamp: string): string {
  return timestamp.split('T')[0];
}

// ============================================================================
// MemoryStore - 存储（JSON Lines 格式）
// ============================================================================

export class MemoryStore {
  private config: MemoryConfig;
  private index: MemoryIndex;

  constructor(workspaceDir?: string) {
    this.config = getConfig(workspaceDir);
    this.index = this.loadIndex();
    this.init();
  }

  private init(): void {
    ensureDir(this.config.dailyDir);
    ensureDir(this.config.longtermDir);
    ensureDir(this.config.archiveDir);
    ensureDir(this.config.emotionDir);
  }

  // 加载索引
  private loadIndex(): MemoryIndex {
    if (fs.existsSync(this.config.indexFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.config.indexFile, 'utf-8'));
      } catch {
        return this.createDefaultIndex();
      }
    }
    return this.createDefaultIndex();
  }

  private createDefaultIndex(): MemoryIndex {
    return {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      totalMemories: 0,
      byDate: {},
      byType: { episodic: [], semantic: [], procedural: [], self: [] },
      byTag: {},
      byPrivacy: { P0: [], P1: [], P2: [], P3: [], P4: [] },
      importantMemories: [],
    };
  }

  // 保存索引
  private saveIndex(): void {
    this.index.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.config.indexFile, JSON.stringify(this.index, null, 2), 'utf-8');
  }

  /**
   * 保存记忆（JSON Lines 格式）
   * 每条记忆一个 JSON 行，便于追加和解析
   */
  save(memory: Omit<Memory, 'id' | 'timestamp' | 'accessCount'>): string {
    const id = generateId();
    const timestamp = new Date().toISOString();
    
    const fullMemory: Memory = {
      ...memory,
      id,
      timestamp,
      accessCount: 0,
      accessedAt: timestamp,
    };

    const date = formatDate();
    const filePath = path.join(this.config.dailyDir, `${date}.jsonl`);
    
    // JSON Lines 格式：每行一个 JSON
    const line = JSON.stringify(fullMemory);
    fs.appendFileSync(filePath, line + '\n', 'utf-8');
    
    // 更新索引
    this.updateIndex(fullMemory, date);
    
    return id;
  }

  // 更新索引
  private updateIndex(memory: Memory, date: string): void {
    this.index.totalMemories++;
    
    // 按日期索引
    if (!this.index.byDate[date]) {
      this.index.byDate[date] = [];
    }
    this.index.byDate[date].push(memory.id);
    
    // 按类型索引
    this.index.byType[memory.type].push(memory.id);
    
    // 按标签索引
    for (const tag of memory.tags) {
      if (!this.index.byTag[tag]) {
        this.index.byTag[tag] = [];
      }
      this.index.byTag[tag].push(memory.id);
    }
    
    // 按隐私索引
    this.index.byPrivacy[memory.privacy].push(memory.id);
    
    // 重要记忆（高情感）
    if (memory.emotion >= 0.7) {
      this.index.importantMemories.push(memory.id);
    }
    
    this.saveIndex();
  }

  /**
   * 更新记忆访问
   */
  updateAccess(memoryId: string, date: string): void {
    const filePath = path.join(this.config.dailyDir, `${date}.jsonl`);
    if (!fs.existsSync(filePath)) return;
    
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim());
    const updated: string[] = [];
    
    for (const line of lines) {
      try {
        const memory = JSON.parse(line);
        if (memory.id === memoryId) {
          memory.accessCount = (memory.accessCount || 0) + 1;
          memory.accessedAt = new Date().toISOString();
        }
        updated.push(JSON.stringify(memory));
      } catch {
        // 跳过无效行
      }
    }
    
    fs.writeFileSync(filePath, updated.join('\n') + '\n', 'utf-8');
  }

  /**
   * 删除记忆
   */
  delete(memoryId: string, date: string): boolean {
    const filePath = path.join(this.config.dailyDir, `${date}.jsonl`);
    if (!fs.existsSync(filePath)) return false;
    
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim());
    const updated: string[] = [];
    let deleted = false;
    
    for (const line of lines) {
      try {
        const memory = JSON.parse(line);
        if (memory.id === memoryId) {
          deleted = true;
          continue; // 跳过就是要删除的
        }
        updated.push(JSON.stringify(memory));
      } catch {
        // 跳过无效行
      }
    }
    
    if (deleted) {
      fs.writeFileSync(filePath, updated.join('\n') + '\n', 'utf-8');
      this.removeFromIndex(memoryId);
    }
    
    return deleted;
  }

  private removeFromIndex(memoryId: string): void {
    this.index.totalMemories = Math.max(0, this.index.totalMemories - 1);
    
    // 从所有索引中移除
    for (const date in this.index.byDate) {
      this.index.byDate[date] = this.index.byDate[date].filter(id => id !== memoryId);
    }
    for (const type in this.index.byType) {
      this.index.byType[type as MemoryType] = this.index.byType[type as MemoryType].filter(id => id !== memoryId);
    }
    for (const tag in this.index.byTag) {
      this.index.byTag[tag] = this.index.byTag[tag].filter(id => id !== memoryId);
    }
    for (const privacy in this.index.byPrivacy) {
      this.index.byPrivacy[privacy as PrivacyLevel] = this.index.byPrivacy[privacy as PrivacyLevel].filter(id => id !== memoryId);
    }
    this.index.importantMemories = this.index.importantMemories.filter(id => id !== memoryId);
    
    this.saveIndex();
  }

  // 保存偏好
  savePreferences(prefs: UserPreferences): void {
    fs.writeFileSync(this.config.preferencesFile, JSON.stringify(prefs, null, 2), 'utf-8');
  }

  // 加载偏好
  loadPreferences(): UserPreferences {
    if (!fs.existsSync(this.config.preferencesFile)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(this.config.preferencesFile, 'utf-8'));
    } catch {
      return {};
    }
  }

  // 保存身份
  saveIdentity(identity: Identity): void {
    const filePath = path.join(this.config.workspaceDir, 'IDENTITY.md');
    let content = '# IDENTITY.md - 我是谁？\n\n';
    for (const [key, value] of Object.entries(identity)) {
      content += `- **${key}**: ${value}\n`;
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  // 加载身份
  loadIdentity(): Identity {
    const filePath = path.join(this.config.workspaceDir, 'IDENTITY.md');
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const identity: Identity = {};
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\- \*\*(.+?)\*\*: (.+)$/);
      if (match) {
        identity[match[1]] = match[2].trim();
      }
    }
    return identity;
  }

  // 获取索引
  getIndex(): MemoryIndex {
    return { ...this.index };
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

  /**
   * 加载单条记忆
   */
  load(memoryId: string, date: string): Memory | null {
    const filePath = path.join(this.config.dailyDir, `${date}.jsonl`);
    if (!fs.existsSync(filePath)) return null;
    
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const memory = JSON.parse(line) as Memory;
        if (memory.id === memoryId) {
          return memory;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * 加载今天的记忆
   */
  loadTodayMemories(): Memory[] {
    const today = formatDate();
    return this.loadFromFile(today);
  }

  /**
   * 加载指定日期的记忆
   */
  loadFromDate(date: string): Memory[] {
    return this.loadFromFile(date);
  }

  /**
   * 从文件加载（支持日期或 .jsonl）
   */
  private loadFromFile(dateOrFile: string): Memory[] {
    let filePath: string;
    if (dateOrFile.endsWith('.jsonl')) {
      filePath = dateOrFile;
    } else {
      filePath = path.join(this.config.dailyDir, `${dateOrFile}.jsonl`);
    }
    
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim());
    const memories: Memory[] = [];
    
    for (const line of lines) {
      try {
        memories.push(JSON.parse(line) as Memory);
      } catch {
        continue;
      }
    }
    
    return memories.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * 加载最近 N 天的记忆
   */
  loadRecentMemories(days: number = 7): Memory[] {
    const memories: Memory[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      
      const dayMemories = this.loadFromFile(dateStr);
      memories.push(...dayMemories);
    }
    
    return memories;
  }

  /**
   * 搜索记忆（关键词）
   */
  search(keyword: string, days: number = 30): Memory[] {
    const recent = this.loadRecentMemories(days);
    const kw = keyword.toLowerCase();
    
    return recent.filter(m => 
      m.content.toLowerCase().includes(kw) ||
      m.tags.some(t => t.toLowerCase().includes(kw))
    );
  }

  /**
   * 按标签搜索
   */
  searchByTag(tag: string): Memory[] {
    const recent = this.loadRecentMemories(30);
    return recent.filter(m => 
      m.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }

  /**
   * 按类型搜索
   */
  searchByType(type: MemoryType): Memory[] {
    const recent = this.loadRecentMemories(30);
    return recent.filter(m => m.type === type);
  }

  /**
   * 获取重要记忆（高情感）
   */
  loadImportantMemories(): Memory[] {
    const recent = this.loadRecentMemories(30);
    return recent.filter(m => m.emotion >= 0.7);
  }

  /**
   * 获取统计信息
   */
  getStats(): MemoryStats {
    const memories = this.loadRecentMemories(30);
    const stats: MemoryStats = {
      total: memories.length,
      byType: { episodic: 0, semantic: 0, procedural: 0, self: 0 },
      byPrivacy: { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 },
      byDate: {},
    };
    
    for (const m of memories) {
      stats.byType[m.type]++;
      stats.byPrivacy[m.privacy]++;
      const date = getDateFromTimestamp(m.timestamp);
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
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

  /**
   * 智能遗忘评估
   * 根据情感强度、访问频率、年龄计算重要性
   */
  evaluateImportance(memory: Memory): number {
    const age = Date.now() - new Date(memory.timestamp).getTime();
    const ageDays = age / (1000 * 60 * 60 * 24);
    
    // 重要性 = 情感强度 * 0.5 + 访问次数 * 0.3 + 新近度 * 0.2
    const recency = Math.max(0, 1 - ageDays / 90); // 90天内越新越好
    
    return memory.emotion * 0.5 + Math.min(memory.accessCount / 10, 1) * 0.3 + recency * 0.2;
  }

  /**
   * 运行自动清理
   * - 超过 90 天的记忆归档
   * - 低于 0.3 重要性的记忆可删除
   */
  runAutoCleanup(): { archived: number; deleted: number; summary: string[] } {
    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    let archived = 0;
    let deleted = 0;
    const summary: string[] = [];
    
    if (!fs.existsSync(this.config.dailyDir)) {
      return { archived, deleted, summary };
    }
    
    const files = fs.readdirSync(this.config.dailyDir).filter(f => f.endsWith('.jsonl'));
    
    for (const file of files) {
      const filePath = path.join(this.config.dailyDir, file);
      const stat = fs.statSync(filePath);
      
      // 超过90天，直接归档
      if (stat.mtimeMs < ninetyDaysAgo) {
        const archivePath = path.join(this.config.archiveDir, file);
        fs.renameSync(filePath, archivePath);
        archived++;
        summary.push(`📦 归档: ${file}`);
        continue;
      }
      
      // 30-90天：评估重要性，低于阈值可删除
      if (stat.mtimeMs < thirtyDaysAgo) {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim());
        const kept: string[] = [];
        
        for (const line of lines) {
          try {
            const memory = JSON.parse(line) as Memory;
            const importance = this.evaluateImportance(memory);
            
            if (importance < 0.3) {
              deleted++;
              summary.push(`🗑️ 删除: ${memory.content.substring(0, 30)}...`);
            } else {
              kept.push(line);
            }
          } catch {
            continue;
          }
        }
        
        if (kept.length === 0) {
          fs.unlinkSync(filePath);
        } else {
          fs.writeFileSync(filePath, kept.join('\n') + '\n', 'utf-8');
        }
      }
    }
    
    return { archived, deleted, summary };
  }

  /**
   * 获取遗忘统计
   */
  getStats(): { daily: number; archive: number; totalSize: string } {
    let daily = 0;
    let archive = 0;
    let totalSize = 0;
    
    if (fs.existsSync(this.config.dailyDir)) {
      daily = fs.readdirSync(this.config.dailyDir).filter(f => f.endsWith('.jsonl')).length;
      const files = fs.readdirSync(this.config.dailyDir);
      for (const f of files) {
        totalSize += fs.statSync(path.join(this.config.dailyDir, f)).size;
      }
    }
    
    if (fs.existsSync(this.config.archiveDir)) {
      archive = fs.readdirSync(this.config.archiveDir).filter(f => f.endsWith('.jsonl')).length;
    }
    
    return { 
      daily, 
      archive, 
      totalSize: `${(totalSize / 1024).toFixed(1)} KB` 
    };
  }

  /**
   * 恢复归档
   */
  restore(fileName: string): boolean {
    const archivePath = path.join(this.config.archiveDir, fileName);
    const dailyPath = path.join(this.config.dailyDir, fileName);
    
    if (!fs.existsSync(archivePath)) return false;
    
    fs.renameSync(archivePath, dailyPath);
    return true;
  }

  /**
   * 列出归档文件
   */
  listArchives(): string[] {
    if (!fs.existsSync(this.config.archiveDir)) return [];
    return fs.readdirSync(this.config.archiveDir).filter(f => f.endsWith('.jsonl'));
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

  // ==================== 存储操作 ====================
  
  /**
   * 保存记忆
   */
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

  /**
   * 删除记忆
   */
  delete(memoryId: string, date?: string): boolean {
    return this.store.delete(memoryId, date || formatDate());
  }

  /**
   * 保存用户偏好
   */
  savePreferences(prefs: UserPreferences): void {
    this.store.savePreferences(prefs);
  }

  /**
   * 保存身份
   */
  saveIdentity(identity: Identity): void {
    this.store.saveIdentity(identity);
  }

  // ==================== 读取操作 ====================
  
  /**
   * 获取今天的记忆
   */
  getToday(): Memory[] {
    return this.loader.loadTodayMemories();
  }

  /**
   * 获取最近 N 天的记忆
   */
  getRecent(days: number = 7): Memory[] {
    return this.loader.loadRecentMemories(days);
  }

  /**
   * 获取单条记忆
   */
  get(memoryId: string, date?: string): Memory | null {
    return this.loader.load(memoryId, date || formatDate());
  }

  /**
   * 获取用户偏好
   */
  getPreferences(): UserPreferences {
    return this.store.loadPreferences();
  }

  /**
   * 获取身份
   */
  getIdentity(): Identity {
    return this.store.loadIdentity();
  }

  // ==================== 搜索 ====================
  
  /**
   * 关键词搜索
   */
  search(keyword: string, days?: number): Memory[] {
    return this.loader.search(keyword, days);
  }

  /**
   * 标签搜索
   */
  searchByTag(tag: string): Memory[] {
    return this.loader.searchByTag(tag);
  }

  /**
   * 类型搜索
   */
  searchByType(type: MemoryType): Memory[] {
    return this.loader.searchByType(type);
  }

  /**
   * 获取重要记忆
   */
  getImportant(): Memory[] {
    return this.loader.loadImportantMemories();
  }

  // ==================== 统计 ====================
  
  /**
   * 获取统计信息
   */
  stats(): MemoryStats {
    return this.loader.getStats();
  }

  /**
   * 获取索引
   */
  getIndex(): MemoryIndex {
    return this.store.getIndex();
  }

  // ==================== 遗忘 ====================
  
  /**
   * 运行自动清理
   */
  cleanup(): { archived: number; deleted: number; summary: string[] } {
    return this.forgetting.runAutoCleanup();
  }

  /**
   * 获取遗忘统计
   */
  forgettingStats(): { daily: number; archive: number; totalSize: string } {
    return this.forgetting.getStats();
  }

  /**
   * 列出归档
   */
  listArchives(): string[] {
    return this.forgetting.listArchives();
  }

  /**
   * 恢复归档
   */
  restore(fileName: string): boolean {
    return this.forgetting.restore(fileName);
  }

  // ==================== 快捷方法 ====================
  
  /**
   * 快速记住
   */
  rememberThis(content: string, important: boolean = false): string {
    return this.save(content, {
      emotion: important ? 0.9 : 0.5,
      tags: important ? ['重要'] : [],
    });
  }

  /**
   * 询问记得什么
   */
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
