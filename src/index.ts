/**
 * OpenClaw Agent System - 主入口 (TypeScript)
 * 完整的 Agent 模板系统
 */

// 导出各个系统
export { EmotionSystem, MoodType, EmotionState, EmotionConfig } from './systems/emotion';
export { InputAnalyzer, Intent, IntentType } from './systems/input';
export { BootstrapEngine, BootstrapState } from './systems/bootstrap';
export { CognitionSystem, Task, Decision, UserPreferences } from './systems/cognition';
export { OutputSystem, OutputContent, OutputFormat, OutputStyle } from './systems/output';

// Agent 系统主类
import { EmotionSystem } from './systems/emotion';
import { InputAnalyzer } from './systems/input';
import { BootstrapEngine } from './systems/bootstrap';
import { CognitionSystem } from './systems/cognition';
import { OutputSystem } from './systems/output';

export class AgentSystem {
  private emotion: EmotionSystem;
  private input: InputAnalyzer;
  private bootstrap: BootstrapEngine;
  private cognition: CognitionSystem;
  private output: OutputSystem;
  
  constructor(dataDir?: string) {
    this.emotion = new EmotionSystem();
    this.input = new InputAnalyzer();
    this.bootstrap = new BootstrapEngine(dataDir);
    this.cognition = new CognitionSystem(dataDir);
    this.output = new OutputSystem();
  }
  
  // 获取各子系统
  getEmotion(): EmotionSystem { return this.emotion; }
  getInput(): InputAnalyzer { return this.input; }
  getBootstrap(): BootstrapEngine { return this.bootstrap; }
  getCognition(): CognitionSystem { return this.cognition; }
  getOutput(): OutputSystem { return this.output; }
  
  // 便捷方法：处理用户输入的完整流程
  processUserInput(text: string): {
    intent: ReturnType<InputAnalyzer['analyze']>;
    emotion: ReturnType<EmotionSystem['getState']>;
    response: string;
  } {
    // 1. 分析意图
    const intent = this.input.analyze(text);
    
    // 2. 分析情感
    const emotionAnalysis = this.emotion.analyzeMessage(text);
    if (emotionAnalysis.mood !== this.emotion.getState().mood) {
      this.emotion.setMood(emotionAnalysis.mood);
    }
    
    // 3. 认知处理
    const cognitionResult = this.cognition.process({ type: intent.type, action: intent.action });
    
    // 4. 生成回复
    const response = this.output.generateResponse(
      cognitionResult.allowed ? '好的，我来处理' : cognitionResult.decision.reason,
      cognitionResult.preferences.communicationStyle
    );
    
    return {
      intent,
      emotion: this.emotion.getState(),
      response: response.content,
    };
  }
  
  // 获取情感显示
  getEmotionDisplay(compact: boolean = true): string {
    return compact 
      ? this.emotion.getCompactDisplay() 
      : this.emotion.getFullDisplay();
  }
}

export default AgentSystem;
