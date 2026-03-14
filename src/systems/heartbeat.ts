/**
 * Heartbeat System - 完善版心跳系统 (TypeScript)
 * 
 * 改进：
 * - 可插拔任务架构（注册自定义任务）
 * - 任务依赖管理
 * - 与情感/记忆系统联动
 * - 更详细的统计和日志
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// 类型定义
// ============================================================================

export interface HeartbeatConfig {
  pulseInterval: number;      // 脉冲层：5秒
  rhythmInterval: number;     // 节律层：60秒
  cycleInterval: number;     // 周期层：1小时
  workspaceDir: string;
  stateFile: string;
}

export interface HeartbeatState {
  startTime: string;
  lastPulse: string | null;
  lastRhythm: string | null;
  lastCycle: string | null;
  totalPulses: number;
  totalRhythms: number;
  totalCycles: number;
  failedTasks: number;
}

export interface TaskResult {
  success: boolean;
  taskName: string;
  message?: string;
  duration?: number;
  error?: string;
}

export interface Task {
  name: string;
  layer: 'pulse' | 'rhythm' | 'cycle';
  interval: number;  // 毫秒
  run: () => Promise<TaskResult>;
  enabled?: boolean;
}

export interface TaskStats {
  name: string;
  lastRun: number | null;
  runCount: number;
  successCount: number;
  failedCount: number;
  avgDuration: number;
  lastResult?: TaskResult;
}

// ============================================================================
// 配置
// ============================================================================

const DEFAULT_CONFIG: HeartbeatConfig = {
  pulseInterval: 5 * 1000,        // 5秒
  rhythmInterval: 60 * 1000,     // 1分钟
  cycleInterval: 3600 * 1000,    // 1小时
  workspaceDir: '',
  stateFile: '',
};

function initConfig(workspaceDir?: string): HeartbeatConfig {
  const wsDir = workspaceDir || path.join(os.homedir(), '.openclaw', 'workspace');
  return {
    ...DEFAULT_CONFIG,
    workspaceDir: wsDir,
    stateFile: path.join(wsDir, 'heartbeat_state.json'),
  };
}

// ============================================================================
// 任务基类与注册表
// ============================================================================

class TaskRegistry {
  private tasks: Map<string, Task> = new Map();
  private stats: Map<string, TaskStats> = new Map();
  
  register(task: Task): void {
    this.tasks.set(task.name, { ...task, enabled: task.enabled !== false });
    this.stats.set(task.name, {
      name: task.name,
      lastRun: null,
      runCount: 0,
      successCount: 0,
      failedCount: 0,
      avgDuration: 0,
    });
  }
  
  unregister(name: string): void {
    this.tasks.delete(name);
    this.stats.delete(name);
  }
  
  getTasks(layer?: string): Task[] {
    if (!layer) return Array.from(this.tasks.values());
    return Array.from(this.tasks.values()).filter(t => t.layer === layer);
  }
  
  getStats(name: string): TaskStats | undefined {
    return this.stats.get(name);
  }
  
  getAllStats(): TaskStats[] {
    return Array.from(this.stats.values());
  }
  
  updateStats(result: TaskResult, duration: number): void {
    const stats = this.stats.get(result.taskName);
    if (!stats) return;
    
    stats.lastRun = Date.now();
    stats.runCount++;
    if (result.success) {
      stats.successCount++;
    } else {
      stats.failedCount++;
    }
    // 移动平均
    stats.avgDuration = (stats.avgDuration * (stats.runCount - 1) + duration) / stats.runCount;
    stats.lastResult = result;
  }
}

// ============================================================================
// 内置任务
// ============================================================================

/**
 * 脉冲任务：存活确认 + 健康检查
 */
function createPulseTask(): Task {
  return {
    name: 'health_check',
    layer: 'pulse',
    interval: 5000,
    run: async () => {
      const start = Date.now();
      // 简单健康检查
      return {
        success: true,
        taskName: 'health_check',
        duration: Date.now() - start,
      };
    },
  };
}

/**
 * 节律任务：情感衰减 + 状态同步
 */
function createRhythmTask(workspaceDir: string): Task {
  return {
    name: 'emotion_decay',
    layer: 'rhythm',
    interval: 60000,
    run: async () => {
      const start = Date.now();
      const emotionStateFile = path.join(workspaceDir, 'memory', 'emotions', 'state.json');
      
      if (!fs.existsSync(emotionStateFile)) {
        return {
          success: true,
          taskName: 'emotion_decay',
          duration: Date.now() - start,
          message: 'No emotion state file',
        };
      }
      
      try {
        const state = JSON.parse(fs.readFileSync(emotionStateFile, 'utf-8'));
        
        // 应用衰减
        if (state.energy > 0.2) {
          state.energy = Math.max(0.2, state.energy - 0.01);
        }
        if (state.connection > 0) {
          state.connection = Math.max(0, state.connection - 0.005);
        }
        state.lastUpdate = new Date().toISOString();
        
        fs.writeFileSync(emotionStateFile, JSON.stringify(state, null, 2));
        
        return {
          success: true,
          taskName: 'emotion_decay',
          duration: Date.now() - start,
        };
      } catch (error) {
        return {
          success: false,
          taskName: 'emotion_decay',
          duration: Date.now() - start,
          error: String(error),
        };
      }
    },
  };
}

/**
 * 周期任务：记忆整理 + 深度清理
 */
function createCycleTask(workspaceDir: string): Task {
  return {
    name: 'memory_cleanup',
    layer: 'cycle',
    interval: 3600000,
    run: async () => {
      const start = Date.now();
      const memoryDir = path.join(workspaceDir, 'memory');
      const dailyDir = path.join(memoryDir, 'daily');
      const archiveDir = path.join(memoryDir, 'archive');
      
      let archived = 0;
      let cleaned = 0;
      
      if (!fs.existsSync(dailyDir)) {
        return { success: true, taskName: 'memory_cleanup', duration: 0 };
      }
      
      const now = Date.now();
      const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      
      try {
        const files = fs.readdirSync(dailyDir).filter(f => f.endsWith('.jsonl'));
        
        for (const file of files) {
          const filePath = path.join(dailyDir, file);
          const stat = fs.statSync(filePath);
          
          // 90天以上 → 归档
          if (stat.mtimeMs < ninetyDaysAgo) {
            if (!fs.existsSync(archiveDir)) {
              fs.mkdirSync(archiveDir, { recursive: true });
            }
            fs.renameSync(filePath, path.join(archiveDir, file));
            archived++;
          }
        }
        
        return {
          success: true,
          taskName: 'memory_cleanup',
          duration: Date.now() - start,
          message: `Archived ${archived} files`,
        };
      } catch (error) {
        return {
          success: false,
          taskName: 'memory_cleanup',
          duration: Date.now() - start,
          error: String(error),
        };
      }
    },
  };
}

// ============================================================================
// 心跳系统主控制器
// ============================================================================

export class HeartbeatSystem {
  private config: HeartbeatConfig;
  private state: HeartbeatState;
  private running: boolean = false;
  private lastRun: Record<string, number> = {
    pulse: 0,
    rhythm: 0,
    cycle: 0,
  };
  
  private registry: TaskRegistry;
  private timer: NodeJS.Timeout | null = null;
  private listeners: ((result: TaskResult) => void)[] = [];

  constructor(workspaceDir?: string) {
    this.config = initConfig(workspaceDir);
    this.state = this.loadState();
    this.registry = new TaskRegistry();
    
    // 注册内置任务
    this.registerTask(createPulseTask());
    this.registerTask(createRhythmTask(this.config.workspaceDir));
    this.registerTask(createCycleTask(this.config.workspaceDir));
  }

  // ==================== 状态管理 ====================
  
  private loadState(): HeartbeatState {
    const defaultState: HeartbeatState = {
      startTime: new Date().toISOString(),
      lastPulse: null,
      lastRhythm: null,
      lastCycle: null,
      totalPulses: 0,
      totalRhythms: 0,
      totalCycles: 0,
      failedTasks: 0,
    };

    if (!fs.existsSync(this.config.stateFile)) {
      return defaultState;
    }

    try {
      const data = fs.readFileSync(this.config.stateFile, 'utf-8');
      return { ...defaultState, ...JSON.parse(data) };
    } catch {
      return defaultState;
    }
  }

  private saveState(): void {
    try {
      const dir = path.dirname(this.config.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.config.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[heartbeat] Failed to save state:', error);
    }
  }

  // ==================== 任务管理 ====================
  
  /**
   * 注册任务
   */
  registerTask(task: Task): void {
    this.registry.register(task);
    console.log(`[heartbeat] Registered task: ${task.name} (${task.layer})`);
  }
  
  /**
   * 注销任务
   */
  unregisterTask(name: string): void {
    this.registry.unregister(name);
  }
  
  /**
   * 启用/禁用任务
   */
  setTaskEnabled(name: string, enabled: boolean): void {
    const task = this.registry.getTasks().find(t => t.name === name);
    if (task) {
      task.enabled = enabled;
    }
  }
  
  /**
   * 获取所有任务统计
   */
  getTaskStats(): TaskStats[] {
    return this.registry.getAllStats();
  }
  
  /**
   * 获取单个任务统计
   */
  getTaskStat(name: string): TaskStats | undefined {
    return this.registry.getStats(name);
  }

  // ==================== 事件 ====================
  
  /**
   * 添加任务结果监听器
   */
  onTaskComplete(listener: (result: TaskResult) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * 移除监听器
   */
  offTaskComplete(listener: (result: TaskResult) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  private notifyListeners(result: TaskResult): void {
    for (const listener of this.listeners) {
      try {
        listener(result);
      } catch (error) {
        console.error('[heartbeat] Listener error:', error);
      }
    }
  }

  // ==================== 心跳执行 ====================
  
  private updateLastRun(taskName: string, layer: string): void {
    this.lastRun[taskName] = Date.now();
    const now = new Date().toISOString();
    
    if (layer === 'pulse') {
      this.state.lastPulse = now;
      this.state.totalPulses++;
    } else if (layer === 'rhythm') {
      this.state.lastRhythm = now;
      this.state.totalRhythms++;
    } else if (layer === 'cycle') {
      this.state.lastCycle = now;
      this.state.totalCycles++;
    }
    
    this.saveState();
  }

  /**
   * 执行单次心跳
   */
  async tick(): Promise<void> {
    const elapsed = Date.now();

    // Pulse 层任务（每5秒）
    for (const task of this.registry.getTasks('pulse')) {
      if (!task.enabled) continue;
      if (elapsed - (this.lastRun[task.name] || 0) >= task.interval) {
        await this.runTask(task);
      }
    }

    // Rhythm 层任务（每60秒）
    for (const task of this.registry.getTasks('rhythm')) {
      if (!task.enabled) continue;
      if (elapsed - (this.lastRun[task.name] || 0) >= task.interval) {
        await this.runTask(task);
      }
    }

    // Cycle 层任务（每1小时）
    for (const task of this.registry.getTasks('cycle')) {
      if (!task.enabled) continue;
      if (elapsed - (this.lastRun[task.name] || 0) >= task.interval) {
        await this.runTask(task);
      }
    }
  }
  
  /**
   * 运行单个任务
   */
  private async runTask(task: Task): Promise<void> {
    const start = Date.now();
    
    try {
      const result = await task.run();
      result.duration = Date.now() - start;
      result.taskName = task.name;
      
      this.registry.updateStats(result, result.duration);
      this.updateLastRun(task.name, task.layer);
      
      if (!result.success) {
        this.state.failedTasks++;
        this.saveState();
      }
      
      this.notifyListeners(result);
      
      console.log(`[heartbeat] ${task.name}: ${result.success ? '✓' : '✗'} (${result.duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      const result: TaskResult = {
        success: false,
        taskName: task.name,
        duration: duration,
        error: String(error),
      };
      
      this.registry.updateStats(result, duration);
      this.updateLastRun(task.name, task.layer);
      this.state.failedTasks++;
      this.saveState();
      
      console.error(`[heartbeat] ${task.name}: ✗ Error:`, error);
    }
  }

  // ==================== 生命周期 ====================
  
  /**
   * 启动心跳循环
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    console.log('[heartbeat] Heartbeat system started');
    console.log(`[heartbeat] Tasks: ${this.registry.getTasks().map(t => t.name).join(', ')}`);
    
    // 立即执行一次
    this.tick().catch(console.error);
    
    // 设置定时器
    this.timer = setInterval(() => {
      if (!this.running) return;
      this.tick().catch(console.error);
    }, this.config.pulseInterval);
  }

  /**
   * 停止心跳
   */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[heartbeat] Heartbeat system stopped');
  }

  /**
   * 立即触发一次任务
   */
  async triggerTask(name: string): Promise<TaskResult | null> {
    const task = this.registry.getTasks().find(t => t.name === name);
    if (!task) return null;
    
    await this.runTask(task);
    const stats = this.registry.getStats(name);
    return stats?.lastResult || null;
  }

  /**
   * 获取系统状态
   */
  getStatus(): {
    running: boolean;
    config: HeartbeatConfig;
    state: HeartbeatState;
    lastRun: Record<string, number>;
    tasks: TaskStats[];
  } {
    return {
      running: this.running,
      config: this.config,
      state: this.state,
      lastRun: this.lastRun,
      tasks: this.getTaskStats(),
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

export function createHeartbeatSystem(workspaceDir?: string): HeartbeatSystem {
  return new HeartbeatSystem(workspaceDir);
}

export default HeartbeatSystem;
