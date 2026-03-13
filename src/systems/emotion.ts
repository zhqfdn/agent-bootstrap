/**
 * Emotion System - 情感系统 (TypeScript 版)
 * 高性能实时情感计算
 */

// 心情类型
export type MoodType = 
  | 'curious' | 'happy' | 'calm' | 'focused' | 'tired' 
  | 'anxious' | 'excited' | 'thoughtful' | 'neutral' | 'sad' | 'grateful';

// 心情 emoji 映射
export const MOOD_EMOJI: Record<MoodType, string> = {
  curious: '🧐', happy: '😊', calm: '😌', focused: '🎯', tired: '😴',
  anxious: '😰', excited: '🤩', thoughtful: '🤔', neutral: '😐', sad: '😢', grateful: '🥰'
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

// 心情 Buff
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

// 情感配置
export interface EmotionConfig {
  energy: { min: number; max: number; default: number; decay_rate: number };
  connection: { min: number; max: number; default: number; boost_rate: number; decay_rate: number };
  stress: { min: number; max: number; default: number; increase_rate: number; decrease_rate: number };
}

export const DEFAULT_CONFIG: EmotionConfig = {
  energy: { min: 0, max: 1, default: 0.7, decay_rate: 0.01 },
  connection: { min: 0, max: 1, default: 0.5, boost_rate: 0.08, decay_rate: 0.005 },
  stress: { min: 0, max: 1, default: 0.1, increase_rate: 0.15, decrease_rate: 0.08 },
};

// 情感状态
export interface EmotionState {
  energy: number;
  mood: MoodType;
  moodStreak: number;
  connection: number;
  stress: number;
  xp: number;
  level: number;
  lastUpdate: string;
}

// 情感系统类
export class EmotionSystem {
  private state: EmotionState;
  private config: EmotionConfig;
  
  constructor(config: Partial<EmotionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createDefaultState();
  }
  
  private createDefaultState(): EmotionState {
    return {
      energy: this.config.energy.default,
      mood: 'curious',
      moodStreak: 0,
      connection: this.config.connection.default,
      stress: this.config.stress.default,
      xp: 0,
      level: 1,
      lastUpdate: new Date().toISOString(),
    };
  }
  
  // 获取当前状态
  getState(): EmotionState {
    return { ...this.state };
  }
  
  // 获取心情 emoji
  getMoodEmoji(): string {
    return MOOD_EMOJI[this.state.mood] || '😐';
  }
  
  // 获取当前心情的 buff
  getMoodBuffs(): Record<string, number> {
    return MOOD_BUFFS[this.state.mood] || {};
  }
  
  // 更新心情
  setMood(mood: MoodType): boolean {
    const validMoods = MOOD_TRANSITIONS[this.state.mood] || [];
    if (validMoods.includes(mood) || mood === this.state.mood) {
      this.state.mood = mood;
      this.state.moodStreak = 0;
      this.state.lastUpdate = new Date().toISOString();
      return true;
    }
    return false;
  }
  
  // 调整数值（带边界限制）
  private adjust(key: 'energy' | 'connection' | 'stress', delta: number): void {
    const config = this.config[key];
    this.state[key] = Math.max(config.min, Math.min(config.max, this.state[key] + delta));
    this.state.lastUpdate = new Date().toISOString();
  }
  
  // 提升连接感
  boost(): void {
    this.adjust('connection', this.config.connection.boost_rate);
    this.addXp(1);
  }
  
  // 互动开始
  onInteractionStart(): void {
    this.adjust('energy', -0.03);
  }
  
  // 互动结束
  onInteractionEnd(success: boolean): void {
    if (success) {
      this.adjust('energy', 0.08);
      this.adjust('stress', -this.config.stress.decrease_rate);
      this.addXp(1);
    } else {
      this.adjust('stress', this.config.stress.increase_rate);
    }
  }
  
  // 添加经验值
  addXp(amount: number): void {
    this.state.xp += amount;
    while (this.state.xp >= this.state.level * 10) {
      this.state.xp -= this.state.level * 10;
      this.state.level++;
    }
  }
  
  // 自然衰减
  decay(): void {
    this.adjust('energy', -this.config.energy.decay_rate);
    this.adjust('connection', -this.config.connection.decay_rate);
    if (this.state.mood === 'calm') {
      this.adjust('stress', -0.02);
    }
  }
  
  // 分析消息情感
  analyzeMessage(message: string): { mood: MoodType; sentiment: number; stress: number } {
    const text = message.toLowerCase();
    let sentiment = 0;
    let stress = 0;
    
    // 正面词
    const positiveWords = ['好', '棒', '赞', '喜欢', '谢谢', '太棒', '开心', '高兴', '成功'];
    // 负面词
    const negativeWords = ['不好', '糟', '差', '失败', '错', '问题', '麻烦', '累', '烦'];
    // 压力词
    const stressWords = ['急', '担心', '害怕', '焦虑', '紧张', '慌'];
    
    positiveWords.forEach(w => { if (text.includes(w)) sentiment += 0.2; });
    negativeWords.forEach(w => { if (text.includes(w)) sentiment -= 0.2; });
    stressWords.forEach(w => { if (text.includes(w)) stress += 0.3; });
    
    sentiment = Math.max(-1, Math.min(1, sentiment));
    stress = Math.min(1, stress);
    
    // 检测心情
    let mood: MoodType = this.state.mood;
    if (text.includes('?')) mood = 'curious';
    else if (sentiment > 0.3) mood = 'happy';
    else if (sentiment < -0.3) mood = 'sad';
    
    return { mood, sentiment, stress };
  }
  
  // 紧凑显示
  getCompactDisplay(): string {
    const e = Math.round(this.state.energy * 100);
    const c = Math.round(this.state.connection * 100);
    const s = Math.round(this.state.stress * 100);
    return `${this.getMoodEmoji()} Lv.${this.state.level} ${this.state.mood} | ⚡${e}% | 💕${c}% | 😰${s}%`;
  }
  
  // 完整显示
  getFullDisplay(): string {
    const e = Math.round(this.state.energy * 100);
    const c = Math.round(this.state.connection * 100);
    const s = Math.round(this.state.stress * 100);
    const buffs = this.getMoodBuffs();
    
    return `┌─────────────────────────────────────────┐
│  💖 情感状态 ${this.getMoodEmoji()}
├─────────────────────────────────────────┤
│  心情: ${this.state.mood} | Lv.${this.state.level}
│  XP: ${this.state.xp}/${this.state.level * 10}
│  ⚡能量: ${e}% | 💕连接: ${c}% | 😰压力: ${s}%
└─────────────────────────────────────────┘`;
  }
  
  // 重置
  reset(): void {
    this.state = this.createDefaultState();
  }
  
  // 导出 JSON
  toJSON(): EmotionState {
    return this.getState();
  }
  
  // 从 JSON 导入
  fromJSON(json: EmotionState): void {
    this.state = { ...json };
  }
}

export default EmotionSystem;
