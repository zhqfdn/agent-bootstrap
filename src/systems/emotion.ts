/**
 * Emotion System - 完善版情感系统 (TypeScript)
 * 
 * 改进：
 * - 持久化存储（状态保存/加载）
 * - 历史记录（情感变化追踪）
 * - 上下文感知（结合对话历史）
 * - 心情进化机制（长期互动形成性格）
 * - 与记忆联动（重要记忆影响情感）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// 类型定义
// ============================================================================

export type MoodType = 
  | 'curious' | 'happy' | 'calm' | 'focused' | 'tired' 
  | 'anxious' | 'excited' | 'thoughtful' | 'neutral' | 'sad' | 'grateful';

// 心情emoji映射
export const MOOD_EMOJI: Record<MoodType, string> = {
  curious: '🧐', happy: '😊', calm: '😌', focused: '🎯', tired: '😴',
  anxious: '😰', excited: '🤩', thoughtful: '🤔', neutral: '😐', sad: '😢', grateful: '🥰'
};

// 心情描述
export const MOOD_DESCRIPTIONS: Record<MoodType, string> = {
  curious: '好奇',
  happy: '开心',
  calm: '平静',
  focused: '专注',
  tired: '疲倦',
  anxious: '焦虑',
  excited: '兴奋',
  thoughtful: '沉思',
  neutral: '中性',
  sad: '难过',
  grateful: '感恩',
};

// 心情转换规则
export const MOOD_TRANSITIONS: Record<MoodType, MoodType[]> = {
  curious: ['excited', 'focused', 'neutral', 'happy'],
  happy: ['excited', 'calm', 'grateful', 'neutral'],
  calm: ['happy', 'neutral', 'tired', 'thoughtful'],
  focused: ['curious', 'excited', 'anxious', 'neutral'],
  tired: ['calm', 'neutral', 'sad', 'anxious'],
  anxious: ['tired', 'focused', 'sad', 'neutral'],
  excited: ['happy', 'focused', 'grateful', 'curious'],
  thoughtful: ['curious', 'calm', 'neutral', 'focused'],
  neutral: ['curious', 'calm', 'happy', 'thoughtful', 'sad'],
  sad: ['tired', 'neutral', 'anxious', 'grateful'],
  grateful: ['happy', 'calm', 'excited', 'neutral'],
};

// 心情Buff
export const MOOD_BUFFS: Record<MoodType, Record<string, number>> = {
  curious: { energy_regen: 0.05, learning: 1.2 },
  happy: { connection_gain: 1.2, stress_resist: 1.3 },
  calm: { energy_efficiency: 1.2, focus: 1.1 },
  focused: { task_efficiency: 1.3, energy_cost: 1.2 },
  tired: { energy_regen: 0.08, error_rate: 1.3 },
  anxious: { stress_accum: 1.5, speed: 0.8 },
  excited: { energy_cost: 1.3, creativity: 1.4 },
  thoughtful: { analysis: 1.3, energy_cost: 1.1 },
  neutral: { balance: 1.0 },
  sad: { connection_gain: 0.5, motivation: 0.7 },
  grateful: { connection_gain: 1.5, stress_reduce: 1.5 },
};

// ============================================================================
// 配置
// ============================================================================

export interface EmotionConfig {
  energy: { min: number; max: number; default: number; decay_rate: number; min_on_idle: number };
  connection: { min: number; max: number; default: number; boost_rate: number; decay_rate: number; max_single_boost: number };
  stress: { min: number; max: number; default: number; increase_rate: number; decrease_rate: number; natural_recover: number };
  xp: { level_up: number; gain_on_interaction: number; gain_on_success: number };
}

export const DEFAULT_CONFIG: EmotionConfig = {
  energy: { min: 0, max: 1, default: 0.7, decay_rate: 0.01, min_on_idle: 0.2 },
  connection: { min: 0, max: 1, default: 0.5, boost_rate: 0.08, decay_rate: 0.005, max_single_boost: 0.15 },
  stress: { min: 0, max: 1, default: 0.1, increase_rate: 0.15, decrease_rate: 0.08, natural_recover: 0.02 },
  xp: { level_up: 30, gain_on_interaction: 1, gain_on_success: 3 },
};

// ============================================================================
// 状态与历史
// ============================================================================

export interface EmotionState {
  energy: number;
  mood: MoodType;
  moodStreak: number;
  moodHistory: MoodType[];        // 最近心情历史
  connection: number;
  stress: number;
  xp: number;
  level: number;
  totalInteractions: number;
  successfulInteractions: number;
  lastUpdate: string;
  lastInteraction: string;
  personality: PersonalityTraits;  // 性格特征
}

export interface PersonalityTraits {
  optimism: number;      // 乐观程度 0-1
  resilience: number;    // 韧性 0-1
  sociability: number;   // 社交倾向 0-1
  curiosity: number;     // 好奇心 0-1
}

export interface EmotionHistoryEntry {
  timestamp: string;
  event: 'interaction' | 'decay' | 'mood_change' | 'level_up' | 'memory_trigger';
  mood?: MoodType;
  moodFrom?: MoodType;
  energy?: number;
  connection?: number;
  stress?: number;
  reason?: string;
}

// ============================================================================
// 配置管理
// ============================================================================

interface EmotionDirs {
  workspaceDir: string;
  emotionDir: string;
  stateFile: string;
  historyFile: string;
}

function getDirs(workspaceDir?: string): EmotionDirs {
  const wsDir = workspaceDir || path.join(os.homedir(), '.openclaw', 'workspace');
  const emoDir = path.join(wsDir, 'memory', 'emotions');
  return {
    workspaceDir: wsDir,
    emotionDir: emoDir,
    stateFile: path.join(emoDir, 'state.json'),
    historyFile: path.join(emoDir, 'history.jsonl'),
  };
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ============================================================================
// 情感分析器（增强版）
// ============================================================================

export class EmotionAnalyzer {
  // 扩展词典
  private static readonly POSITIVE_WORDS = [
    '好', '棒', '赞', '喜欢', '谢谢', '太棒', '开心', '高兴', '成功', '牛', '强',
    '完美', '优秀', '出色', '满意', '感谢', '感恩', '爱', '么么哒', '哈哈', '耶',
    '不错', '很好', '非常好', '超棒', '太强', '爱了', '暖', '甜', '萌', '可爱'
  ];
  
  private static readonly NEGATIVE_WORDS = [
    '不好', '糟', '差', '失败', '错', '问题', '麻烦', '累', '烦', '难', '讨厌',
    '生气', '愤怒', '难过', '伤心', '哭', '郁闷', '不爽', '悲剧', '可惜', '无奈',
    '无语', '抓狂', '崩溃', '傻', '蠢', '笨', '烦死了', '讨厌', '滚', '拉倒'
  ];
  
  private static readonly STRESS_WORDS = [
    '急', '担心', '害怕', '焦虑', '紧张', '慌', '压力', '烦', '不安', '恐惧',
    '怎么办', '会不会', '能不能', '好怕', '吓', '慌死了', '压力山大'
  ];
  
  private static readonly QUESTION_WORDS = ['?', '？', '怎么', '如何', '为什么', '什么', '哪里', '谁', '多少'];
  private static readonly EXCLAMATION_WORDS = ['!', '！', '哇', '啊', '呀', '哈', '耶'];
  
  /**
   * 分析消息情感
   */
  static analyze(text: string, currentMood: MoodType): { 
    sentiment: number;    // -1 到 1
    stress: number;      // 0 到 1
    isQuestion: boolean;
    isExclamation: boolean;
    suggestedMood: MoodType | null;
  } {
    const lower = text.toLowerCase();
    let sentiment = 0;
    let stress = 0;
    
    // 情感分析
    for (const word of this.POSITIVE_WORDS) {
      if (lower.includes(word)) sentiment += 0.15;
    }
    for (const word of this.NEGATIVE_WORDS) {
      if (lower.includes(word)) sentiment -= 0.15;
    }
    for (const word of this.STRESS_WORDS) {
      if (lower.includes(word)) stress += 0.25;
    }
    
    // 边界限制
    sentiment = Math.max(-1, Math.min(1, sentiment));
    stress = Math.min(1, stress);
    
    // 检测问句/感叹句
    const isQuestion = this.QUESTION_WORDS.some(w => text.includes(w));
    const isExclamation = this.EXCLAMATION_WORDS.some(w => text.includes(w)) || 
                          text.includes('!') || text.includes('！');
    
    // 建议心情
    let suggestedMood: MoodType | null = null;
    if (isQuestion) {
      suggestedMood = 'curious';
    } else if (sentiment > 0.4) {
      suggestedMood = 'happy';
    } else if (sentiment < -0.4) {
      suggestedMood = 'sad';
    } else if (stress > 0.5) {
      suggestedMood = 'anxious';
    } else if (isExclamation && sentiment > 0) {
      suggestedMood = 'excited';
    }
    
    return { sentiment, stress, isQuestion, isExclamation, suggestedMood };
  }
  
  /**
   * 计算情感强度
   */
  static getIntensity(text: string): number {
    // 感叹号数量
    const exclamationCount = (text.match(/[!！]/g) || []).length;
    // 问号数量
    const questionCount = (text.match(/[?？]/g) || []).length;
    // 省略号
    const ellipsisCount = (text.match(/[。。.]+/g) || []).length;
    
    let intensity = 0.5;
    intensity += Math.min(exclamationCount * 0.1, 0.3);
    intensity += Math.min(questionCount * 0.05, 0.2);
    intensity += Math.min(ellipsisCount * 0.05, 0.15);
    
    return Math.min(1, intensity);
  }
}

// ============================================================================
// 情感系统类
// ============================================================================

export class EmotionSystem {
  private dirs: EmotionDirs;
  private config: EmotionConfig;
  private state: EmotionState;
  private history: EmotionHistoryEntry[];
  
  constructor(workspaceDir?: string, config?: Partial<EmotionConfig>) {
    this.dirs = getDirs(workspaceDir);
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.history = [];
    
    ensureDir(this.dirs.emotionDir);
    this.state = this.loadState();
    this.loadHistory();
  }
  
  // ==================== 持久化 ====================
  
  private loadState(): EmotionState {
    if (fs.existsSync(this.dirs.stateFile)) {
      try {
        const saved = JSON.parse(fs.readFileSync(this.dirs.stateFile, 'utf-8'));
        return { ...this.createDefaultState(), ...saved };
      } catch {
        // 加载失败，使用默认
      }
    }
    return this.createDefaultState();
  }
  
  private createDefaultState(): EmotionState {
    return {
      energy: this.config.energy.default,
      mood: 'curious',
      moodStreak: 0,
      moodHistory: [],
      connection: this.config.connection.default,
      stress: this.config.stress.default,
      xp: 0,
      level: 1,
      totalInteractions: 0,
      successfulInteractions: 0,
      lastUpdate: new Date().toISOString(),
      lastInteraction: '',
      personality: {
        optimism: 0.5,
        resilience: 0.5,
        sociability: 0.5,
        curiosity: 0.5,
      },
    };
  }
  
  private saveState(): void {
    this.state.lastUpdate = new Date().toISOString();
    fs.writeFileSync(this.dirs.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
  }
  
  private loadHistory(): void {
    if (!fs.existsSync(this.dirs.historyFile)) {
      this.history = [];
      return;
    }
    
    try {
      const lines = fs.readFileSync(this.dirs.historyFile, 'utf-8').split('\n').filter(l => l.trim());
      this.history = lines.slice(-100).map(line => JSON.parse(line)).filter(Boolean);
    } catch {
      this.history = [];
    }
  }
  
  private addHistory(entry: EmotionHistoryEntry): void {
    this.history.push(entry);
    // 只保留最近100条
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
    // 追加到文件
    fs.appendFileSync(this.dirs.historyFile, JSON.stringify(entry) + '\n', 'utf-8');
  }
  
  // ==================== 状态获取 ====================
  
  getState(): EmotionState {
    return { ...this.state };
  }
  
  getMoodEmoji(): string {
    return MOOD_EMOJI[this.state.mood] || '😐';
  }
  
  getMoodDescription(): string {
    return MOOD_DESCRIPTIONS[this.state.mood] || '未知';
  }
  
  getMoodBuffs(): Record<string, number> {
    return MOOD_BUFFS[this.state.mood] || {};
  }
  
  getPersonality(): PersonalityTraits {
    return { ...this.state.personality };
  }
  
  getHistory(limit: number = 10): EmotionHistoryEntry[] {
    return this.history.slice(-limit);
  }
  
  // ==================== 心情管理 ====================
  
  /**
   * 设置心情（带转换验证）
   */
  setMood(mood: MoodType, reason?: string): boolean {
    const validMoods = MOOD_TRANSITIONS[this.state.mood] || [];
    
    // 允许保持当前心情
    if (mood === this.state.mood) {
      this.state.moodStreak++;
      return true;
    }
    
    // 检查是否允许转换
    if (!validMoods.includes(mood)) {
      return false;
    }
    
    const oldMood = this.state.mood;
    this.state.mood = mood;
    this.state.moodStreak = 0;
    
    // 更新历史
    this.state.moodHistory.push(mood);
    if (this.state.moodHistory.length > 10) {
      this.state.moodHistory = this.state.moodHistory.slice(-10);
    }
    
    this.addHistory({
      timestamp: new Date().toISOString(),
      event: 'mood_change',
      mood: mood,
      moodFrom: oldMood,
      reason,
    });
    
    this.saveState();
    return true;
  }
  
  /**
   * 智能心情更新（根据分析结果）
   */
  processMoodChange(analysis: ReturnType<typeof EmotionAnalyzer.analyze>): void {
    if (analysis.suggestedMood && analysis.suggestedMood !== this.state.mood) {
      // 有概率接受建议（基于性格）
      const acceptChance = this.state.personality.curiosity;
      if (Math.random() < acceptChance) {
        this.setMood(analysis.suggestedMood, '消息分析触发');
      }
    }
  }
  
  // ==================== 调整方法 ====================
  
  private adjust(key: 'energy' | 'connection' | 'stress', delta: number): void {
    const cfg = this.config[key];
    const oldValue = this.state[key];
    this.state[key] = Math.max(cfg.min, Math.min(cfg.max, oldValue + delta));
    this.state.lastUpdate = new Date().toISOString();
  }
  
  // ==================== 互动接口 ====================
  
  /**
   * 开始互动
   */
  onInteractionStart(): void {
    this.state.totalInteractions++;
    this.state.lastInteraction = new Date().toISOString();
    this.adjust('energy', -0.03);
  }
  
  /**
   * 互动结束
   */
  onInteractionEnd(success: boolean, messageAnalysis?: ReturnType<typeof EmotionAnalyzer.analyze>): void {
    if (success) {
      // 能量恢复
      this.adjust('energy', 0.08);
      // 压力减轻
      this.adjust('stress', -this.config.stress.decrease_rate);
      // XP增加
      this.addXp(this.config.xp.gain_on_success);
      // 连接感提升
      this.boostConnection();
      // 成功交互计数
      this.state.successfulInteractions++;
      
      this.addHistory({
        timestamp: new Date().toISOString(),
        event: 'interaction',
        energy: this.state.energy,
        connection: this.state.connection,
        stress: this.state.stress,
        reason: '互动成功',
      });
    } else {
      // 压力增加
      this.adjust('stress', this.config.stress.increase_rate);
      // 基于韧性减少压力增加
      const resilienceMitigation = this.state.personality.resilience * 0.3;
      this.adjust('stress', -resilienceMitigation);
    }
    
    // 处理消息分析结果
    if (messageAnalysis) {
      this.processMoodChange(messageAnalysis);
    }
    
    this.saveState();
  }
  
  /**
   * 提升连接感（有上限）
   */
  boostConnection(): void {
    const boost = Math.min(
      this.config.connection.max_single_boost,
      this.config.connection.boost_rate * (1 + this.state.personality.sociability)
    );
    this.adjust('connection', boost);
  }
  
  /**
   * 通用boost
   */
  boost(): void {
    this.boostConnection();
    this.addXp(this.config.xp.gain_on_interaction);
  }
  
  // ==================== XP与等级 ====================
  
  private addXp(amount: number): void {
    const oldLevel = this.state.level;
    this.state.xp += amount;
    
    while (this.state.xp >= this.config.xp.level_up * this.state.level) {
      this.state.xp -= this.config.xp.level_up * this.state.level;
      this.state.level++;
    }
    
    // 升级事件
    if (this.state.level > oldLevel) {
      this.addHistory({
        timestamp: new Date().toISOString(),
        event: 'level_up',
        reason: `升级到 Lv.${this.state.level}`,
      });
    }
  }
  
  // ==================== 衰减 ====================
  
  /**
   * 自然衰减（心跳调用）
   */
  decay(): void {
    // 能量衰减（有下限）
    if (this.state.energy > this.config.energy.min_on_idle) {
      this.adjust('energy', -this.config.energy.decay_rate);
    }
    
    // 连接感衰减
    this.adjust('connection', -this.config.connection.decay_rate);
    
    // 平静心情时压力恢复
    if (this.state.mood === 'calm') {
      this.adjust('stress', -this.config.stress.natural_recover);
    }
    
    // 心情随机波动
    this.maybeChangeMood();
    
    this.addHistory({
      timestamp: new Date().toISOString(),
      event: 'decay',
      energy: this.state.energy,
      connection: this.state.connection,
      stress: this.state.stress,
    });
    
    this.saveState();
  }
  
  /**
   * 心情随机波动
   */
  private maybeChangeMood(): void {
    // 心情持续太久，有概率变化
    if (this.state.moodStreak >= 5) {
      const changeChance = 0.2 + this.state.personality.curiosity * 0.2;
      if (Math.random() < changeChance) {
        const validMoods = MOOD_TRANSITIONS[this.state.mood] || [];
        if (validMoods.length > 0) {
          const newMood = validMoods[Math.floor(Math.random() * validMoods.length)];
          this.setMood(newMood, '自然波动');
        }
      }
    }
  }
  
  // ==================== 消息分析 ====================
  
  /**
   * 分析用户消息
   */
  analyzeMessage(message: string): ReturnType<typeof EmotionAnalyzer.analyze> {
    return EmotionAnalyzer.analyze(message, this.state.mood);
  }
  
  /**
   * 处理用户消息
   */
  processMessage(message: string): void {
    const analysis = this.analyzeMessage(message);
    this.processMoodChange(analysis);
    this.saveState();
  }
  
  // ==================== 记忆联动 ====================
  
  /**
   * 重要记忆触发情感变化
   */
  onMemoryTrigger(emotion: number, content: string): void {
    if (emotion > 0.7) {
      // 高情感记忆 → 转为感恩
      this.setMood('grateful', '重要记忆触发');
      this.adjust('connection', 0.05);
    } else if (emotion < 0.3) {
      // 低情感记忆 → 轻微压力
      this.adjust('stress', 0.02);
    }
    this.saveState();
  }
  
  // ==================== 性格进化 ====================
  
  /**
   * 根据行为模式进化性格
   */
  evolvePersonality(): void {
    const interactionRate = this.state.successfulInteractions / Math.max(1, this.state.totalInteractions);
    
    // 成功率高 → 乐观
    if (interactionRate > 0.7) {
      this.state.personality.optimism = Math.min(1, this.state.personality.optimism + 0.01);
    }
    
    // 失败多 → 韧性（但别太高）
    if (interactionRate < 0.3) {
      this.state.personality.resilience = Math.min(1, this.state.personality.resilience + 0.02);
    }
    
    // 互动多 → 社交
    if (this.state.totalInteractions > 50) {
      this.state.personality.sociability = Math.min(1, this.state.personality.sociability + 0.01);
    }
    
    // 问问题多 → 好奇
    // (需要外部传入问题计数)
  }
  
  // ==================== 显示 ====================
  
  getCompactDisplay(): string {
    const e = Math.round(this.state.energy * 100);
    const c = Math.round(this.state.connection * 100);
    const s = Math.round(this.state.stress * 100);
    const mood = MOOD_DESCRIPTIONS[this.state.mood];
    return `${this.getMoodEmoji()} Lv.${this.state.level} ${mood} | ⚡${e}% | 💕${c}% | 😰${s}%`;
  }
  
  getFullDisplay(): string {
    const e = Math.round(this.state.energy * 100);
    const c = Math.round(this.state.connection * 100);
    const s = Math.round(this.state.stress * 100);
    const buffs = this.getMoodBuffs();
    const personality = this.state.personality;
    
    const buffStr = Object.entries(buffs)
      .filter(([, v]) => v !== 1 && v !== 0)
      .map(([k, v]) => `${k}:${v > 1 ? '+' : ''}${((v - 1) * 100).toFixed(0)}%`)
      .join(', ');
    
    return `┌─────────────────────────────────────────┐
│  💖 情感状态 ${this.getMoodEmoji()}
├─────────────────────────────────────────┤
│  心情: ${MOOD_DESCRIPTIONS[this.state.mood]} | Lv.${this.state.level}
│  XP: ${this.state.xp}/${this.config.xp.level_up * this.state.level}
│  ⚡能量: ${e}% | 💕连接: ${c}% | 😰压力: ${s}%
│  📊 互动: ${this.state.successfulInteractions}/${this.state.totalInteractions}
│  🧬 性格: 乐观${(personality.optimism*100).toFixed(0)}% | 韧性${(personality.resilience*100).toFixed(0)}%
│         社恐${((1-personality.sociability)*100).toFixed(0)}% | 好奇${(personality.curiosity*100).toFixed(0)}%
│  ${buffStr ? '✨ Buff: ' + buffStr : '✨ 无特殊buff'}
└─────────────────────────────────────────┘`;
  }
  
  // ==================== 重置 ====================
  
  reset(): void {
    this.state = this.createDefaultState();
    this.history = [];
    if (fs.existsSync(this.dirs.historyFile)) {
      fs.unlinkSync(this.dirs.historyFile);
    }
    this.saveState();
  }
  
  // ==================== 导出导入 ====================
  
  toJSON(): EmotionState {
    return this.getState();
  }
  
  fromJSON(json: EmotionState): void {
    this.state = { ...this.createDefaultState(), ...json };
    this.saveState();
  }
}

export default EmotionSystem;
