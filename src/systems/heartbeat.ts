/**
 * Heartbeat System - TypeScript 实现
 * 心跳系统：定时执行维护任务
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface HeartbeatConfig {
  PULSE_INTERVAL: number;     // 脉冲层：5秒
  RHYTHM_INTERVAL: number;    // 节律层：60秒
  CYCLE_INTERVAL: number;     // 周期层：1小时
  WORKSPACE_DIR: string;
  MEMORY_DIR: string;
  EMOTION_DIR: string;
  STATE_FILE: string;
}

export interface HeartbeatState {
  start_time: string;
  last_pulse: string | null;
  last_rhythm: string | null;
  last_cycle: string | null;
  [key: string]: unknown;
}

export interface TaskResult {
  success: boolean;
  message?: string;
}

// 默认配置
export const DEFAULT_CONFIG: HeartbeatConfig = {
  PULSE_INTERVAL: 5 * 1000,        // 5秒
  RHYTHM_INTERVAL: 60 * 1000,     // 1分钟
  CYCLE_INTERVAL: 3600 * 1000,    // 1小时
  WORKSPACE_DIR: path.join(os.homedir(), '.openclaw', 'workspace'),
  MEMORY_DIR: '',
  EMOTION_DIR: '',
  STATE_FILE: '',
};

function initConfig(workspaceDir?: string): HeartbeatConfig {
  const config = { ...DEFAULT_CONFIG };
  if (workspaceDir) {
    config.WORKSPACE_DIR = workspaceDir;
  }
  config.MEMORY_DIR = path.join(config.WORKSPACE_DIR, 'memory');
  config.EMOTION_DIR = path.join(config.MEMORY_DIR, 'emotions');
  config.STATE_FILE = path.join(config.WORKSPACE_DIR, 'heartbeat_state.json');
  return config;
}

/**
 * 脉冲层任务：存活确认
 */
class PulseTask {
  name = 'pulse';
  interval: number;

  constructor(config: HeartbeatConfig) {
    this.interval = config.PULSE_INTERVAL;
  }

  async run(): Promise<TaskResult> {
    // 简单确认存活
    return { success: true, message: 'Pulse confirmed' };
  }
}

/**
 * 节律层任务：情感衰减、状态保存
 */
class RhythmTask {
  name = 'rhythm';
  interval: number;
  private config: HeartbeatConfig;
  private lastRun: number = 0;

  constructor(config: HeartbeatConfig) {
    this.interval = config.RHYTHM_INTERVAL;
    this.config = config;
  }

  async run(): Promise<TaskResult> {
    try {
      await this.emotionDecay();
      this.lastRun = Date.now();
      return { success: true, message: 'Rhythm task completed' };
    } catch (error) {
      return { success: false, message: `Rhythm task failed: ${error}` };
    }
  }

  private async emotionDecay(): Promise<void> {
    // 读取情感状态文件并应用衰减
    const emotionStateFile = path.join(this.config.WORKSPACE_DIR, 'HEARTBEAT.md');
    // 如果有情感状态，可以在这里处理衰减
    // 目前简单实现
  }

  shouldRun(elapsed: number): boolean {
    return elapsed - this.lastRun >= this.interval;
  }
}

/**
 * 周期层任务：记忆整理、深度清理
 */
class CycleTask {
  name = 'cycle';
  interval: number;
  private config: HeartbeatConfig;
  private lastRun: number = 0;

  constructor(config: HeartbeatConfig) {
    this.interval = config.CYCLE_INTERVAL;
    this.config = config;
  }

  async run(): Promise<TaskResult> {
    try {
      await this.cleanupOldFiles();
      this.lastRun = Date.now();
      return { success: true, message: 'Cycle task completed' };
    } catch (error) {
      return { success: false, message: `Cycle task failed: ${error}` };
    }
  }

  private async cleanupOldFiles(): Promise<void> {
    // 清理 memory/archive 中的旧记忆（超过90天）
    const archiveDir = path.join(this.config.MEMORY_DIR, 'archive');
    
    if (!fs.existsSync(archiveDir)) {
      return;
    }

    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    
    try {
      const files = fs.readdirSync(archiveDir);
      for (const file of files) {
        const filePath = path.join(archiveDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.mtimeMs < ninetyDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`[heartbeat] Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('[heartbeat] Cleanup error:', error);
    }
  }

  shouldRun(elapsed: number): boolean {
    return elapsed - this.lastRun >= this.interval;
  }
}

/**
 * 心跳系统主控制器
 */
export class HeartbeatSystem {
  private config: HeartbeatConfig;
  private state: HeartbeatState;
  private running: boolean = false;
  private lastRun: Record<string, number> = {
    pulse: 0,
    rhythm: 0,
    cycle: 0,
  };
  
  private pulseTask: PulseTask;
  private rhythmTask: RhythmTask;
  private cycleTask: CycleTask;
  private timer: NodeJS.Timeout | null = null;

  constructor(workspaceDir?: string) {
    this.config = initConfig(workspaceDir);
    this.state = this.loadState();
    
    this.pulseTask = new PulseTask(this.config);
    this.rhythmTask = new RhythmTask(this.config);
    this.cycleTask = new CycleTask(this.config);
  }

  private loadState(): HeartbeatState {
    const defaultState: HeartbeatState = {
      start_time: new Date().toISOString(),
      last_pulse: null,
      last_rhythm: null,
      last_cycle: null,
    };

    if (!fs.existsSync(this.config.STATE_FILE)) {
      return defaultState;
    }

    try {
      const data = fs.readFileSync(this.config.STATE_FILE, 'utf-8');
      return { ...defaultState, ...JSON.parse(data) };
    } catch {
      return defaultState;
    }
  }

  private saveState(): void {
    try {
      const dir = path.dirname(this.config.STATE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.config.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[heartbeat] Failed to save state:', error);
    }
  }

  private updateLastRun(taskName: string): void {
    this.lastRun[taskName] = Date.now();
    this.state[`last_${taskName}`] = new Date().toISOString();
    this.saveState();
  }

  /**
   * 执行一次心跳
   */
  async tick(): Promise<void> {
    const elapsed = Date.now();

    // Pulse 任务（每5秒）
    if (elapsed - this.lastRun.pulse >= this.config.PULSE_INTERVAL) {
      const result = await this.pulseTask.run();
      if (result.success) {
        this.updateLastRun('pulse');
        console.log('[heartbeat] Pulse task completed');
      }
    }

    // Rhythm 任务（每60秒）
    if (elapsed - this.lastRun.rhythm >= this.config.RHYTHM_INTERVAL) {
      const result = await this.rhythmTask.run();
      if (result.success) {
        this.updateLastRun('rhythm');
        console.log('[heartbeat] Rhythm task completed');
      }
    }

    // Cycle 任务（每1小时）
    if (elapsed - this.lastRun.cycle >= this.config.CYCLE_INTERVAL) {
      const result = await this.cycleTask.run();
      if (result.success) {
        this.updateLastRun('cycle');
        console.log('[heartbeat] Cycle task completed');
      }
    }
  }

  /**
   * 启动心跳循环
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    console.log('[heartbeat] Heartbeat system started');
    
    this.timer = setInterval(() => {
      if (!this.running) return;
      this.tick().catch(console.error);
    }, this.config.PULSE_INTERVAL);
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
   * 获取状态
   */
  getStatus(): { running: boolean; lastRun: Record<string, number>; state: HeartbeatState } {
    return {
      running: this.running,
      lastRun: this.lastRun,
      state: this.state,
    };
  }
}

// 导出便捷函数
export function createHeartbeatSystem(workspaceDir?: string): HeartbeatSystem {
  return new HeartbeatSystem(workspaceDir);
}

export default HeartbeatSystem;
