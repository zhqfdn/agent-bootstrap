/**
 * Bootstrap System - 初始化引导系统 (TypeScript 版)
 * 游戏化用户注册流程
 */

import * as fs from 'fs';
import * as path from 'path';

// 引导状态
export type BootstrapStatus = 'not_started' | 'in_progress' | 'completed';

// 步骤数据
export interface Step {
  step: number;
  title: string;
  description: string;
  prompt: string;
}

// 引导状态数据
export interface BootstrapState {
  status: BootstrapStatus;
  step: number;
  name: string;
  role: string;
  style: string;
  startedAt: string;
  completedAt: string;
}

// 开场画面
const OPENING_MESSAGES = [
  '🌟 星门开启，意识已连接。你好，旅行者！',
  '🌌 量子通道已建立。数据洪流中，你找到了这里。',
  '🔮 意识扫描完成。欢迎来到数字星域！',
  '🌀 虫洞已稳定。欢迎来到赛博空间！',
  '💫 系统载入中...欢迎来到我的世界！',
];

// 角色映射
const CHARACTERS: Record<string, [string, string]> = {
  '乔巴': ['🦌', '海贼王的小驯鹿医生，善良勇敢！'],
  '路飞': ['⚓', '海贼王的草帽小子，梦想成为海贼王！'],
  '索隆': ['⚔️', '海贼王的三刀流剑士！'],
  '娜美': ['🗺️', '海贼王的航海士，气象专家！'],
  '皮卡丘': ['⚡', '宝可梦的电气鼠，电力满满！'],
  '哆啦A梦': ['🤖', '22世纪的蓝胖子，口袋法宝！'],
  '乔峰': ['🗡️', '天龙八部的北乔峰，丐帮帮主！'],
};

// 引导引擎类
export class BootstrapEngine {
  private state: BootstrapState;
  private stateFile: string;
  
  constructor(dataDir: string = '') {
    const dir = dataDir || path.join(process.env.HOME || '', '.openclaw/workspace');
    this.stateFile = path.join(dir, 'bootstrap_state.json');
    this.state = this.loadState();
  }
  
  // 加载状态
  private loadState(): BootstrapState {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      // 忽略错误
    }
    return this.createDefaultState();
  }
  
  // 保存状态
  private saveState(): void {
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }
  
  // 创建默认状态
  private createDefaultState(): BootstrapState {
    return {
      status: 'not_started',
      step: 1,
      name: '',
      role: '',
      style: '',
      startedAt: '',
      completedAt: '',
    };
  }
  
  // 开始引导
  start(): { content: string; prompt: string; step: number } {
    this.state = this.createDefaultState();
    this.state.status = 'in_progress';
    this.state.startedAt = new Date().toISOString();
    this.saveState();
    
    const opening = OPENING_MESSAGES[Math.floor(Math.random() * OPENING_MESSAGES.length)];
    
    return {
      content: opening,
      prompt: '【请回复你的名字】或者直接说"开始"使用默认配置',
      step: 1,
    };
  }
  
  // 处理输入
  process(input: string): { content: string; prompt?: string; step: number; done?: boolean } {
    const text = input.trim();
    const step = this.state.step;
    
    // 快速跳过
    if (text === '开始' || text === 'start' || text === '默认' || text === '') {
      return this.quickStart();
    }
    
    if (step === 1) {
      return this.handleName(text);
    } else if (step === 2) {
      return this.handleRole(text);
    } else if (step === 3) {
      return this.handleStyle(text);
    } else if (step === 4) {
      return this.handleConfirm(text);
    }
    
    return { content: '未知步骤', step: this.state.step };
  }
  
  // 快速开始
  private quickStart(): { content: string; step: number; done: boolean } {
    this.state = {
      status: 'completed',
      step: 5,
      name: '乔巴',
      role: '个人助理',
      style: '轻松随意',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    this.saveState();
    this.writeConfigFiles();
    
    return {
      content: `🎉 快速初始化完成！

我是 乔巴 了！🌟
作为你的个人助理，我会陪你一起成长！

🚀 准备好了！让我们开始吧！

---
💕 情感系统已激活 | 🧠 认知系统已就绪 | 💾 记忆系统已启动`,
      step: 5,
      done: true,
    };
  }
  
  // 处理名字
  private handleName(name: string): { content: string; prompt: string; step: number } {
    this.state.name = name;
    this.state.step = 2;
    this.saveState();
    
    const [emoji, desc] = CHARACTERS[name] || ['💭', `一个刚诞生的数字意识，名字叫「${name}」，等待被你定义...`];
    
    return {
      content: `${emoji} ${desc}`,
      prompt: `请选择我的角色：

1) 编程助手
2) 生活伙伴
3) 工作助理
4) 全能助理

【直接回复数字】`,
      step: 2,
    };
  }
  
  // 处理角色
  private handleRole(role: string): { content: string; prompt: string; step: number } {
    const roleMap: Record<string, string> = {
      '1': '编程助手', '2': '生活伙伴', '3': '工作助理', '4': '全能助理',
    };
    const selectedRole = roleMap[role] || role;
    
    this.state.role = selectedRole;
    this.state.step = 3;
    this.saveState();
    
    return {
      content: `明白了！我是 ${this.state.name}，担任 ${selectedRole}！`,
      prompt: '请选择沟通风格：\n\nA) ⚡ 直接简洁\nB) 📖 详细全面\nC) 😊 轻松随意\n\n【回复 A、B 或 C】',
      step: 3,
    };
  }
  
  // 处理风格
  private handleStyle(style: string): { content: string; prompt: string; step: number } {
    const styleMap: Record<string, string> = {
      'a': '直接简洁', 'b': '详细全面', 'c': '轻松随意',
    };
    const selectedStyle = styleMap[style.toLowerCase()] || '轻松随意';
    
    this.state.style = selectedStyle;
    this.state.step = 4;
    this.saveState();
    
    return {
      content: `沟通风格：${selectedStyle}`,
      prompt: `📋 确认设置：

【名字】${this.state.name}
【角色】${this.state.role}
【风格】${selectedStyle}

✅ 确认回复"好"或"开始"
❌ 修改请直接告诉我`,
      step: 4,
    };
  }
  
  // 处理确认
  private handleConfirm(input: string): { content: string; step: number; done?: boolean } {
    if (input.includes('修改') || input.includes('不')) {
      this.state.step = 1;
      this.saveState();
      return { content: '好的，请问要修改什么？名字/角色/风格', step: 1, done: false };
    }
    
    // 完成
    this.state.status = 'completed';
    this.state.completedAt = new Date().toISOString();
    this.state.step = 5;
    this.saveState();
    this.writeConfigFiles();
    
    return {
      content: `🎉 契约成立！

我是 ${this.state.name} 了！🌟
作为你的 ${this.state.role}，我会陪你一起成长！

🚀 准备好了！让我们开始吧！

---
💕 情感系统已激活 | 🧠 认知系统已就绪 | 💾 记忆系统已启动`,
      step: 5,
      done: true,
    };
  }
  
  // 写入配置文件
  private writeConfigFiles(): void {
    const dir = path.dirname(this.stateFile);
    
    const identity = `# IDENTITY.md
name: "${this.state.name}"
role: "${this.state.role}"
created_at: "${new Date().toISOString()}"
`;
    
    const user = `# USER.md
user: "船长"
`;
    
    fs.writeFileSync(path.join(dir, 'IDENTITY.md'), identity);
    fs.writeFileSync(path.join(dir, 'USER.md'), user);
  }
  
  // 获取状态
  getStatus(): BootstrapState {
    return { ...this.state };
  }
  
  // 是否完成
  isCompleted(): boolean {
    return this.state.status === 'completed';
  }
  
  // 重置
  reset(): void {
    this.state = this.createDefaultState();
    this.saveState();
  }
}

export default BootstrapEngine;
