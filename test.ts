/**
 * 测试 TypeScript 版 Agent 系统
 */

import { AgentSystem } from './src/index';

console.log('=== Agent System Test (TypeScript) ===\n');

// 创建系统
const agent = new AgentSystem();

// 1. 测试情感系统
console.log('1. 情感系统:');
console.log(agent.getEmotionDisplay(true));

agent.getEmotion().boost();
agent.getEmotion().addXp(5);
console.log('互动后:', agent.getEmotionDisplay(true));

// 2. 测试输入系统
console.log('\n2. 输入系统:');
const intent = agent.getInput().analyze('帮我写一个Hello World程序');
console.log(agent.getInput().getIntentDisplay(intent));

// 3. 测试引导系统
console.log('\n3. 引导系统:');
const start = agent.getBootstrap().start();
console.log(start.content);

const step2 = agent.getBootstrap().process('乔巴');
console.log('\n输入"乔巴":');
console.log(step2.prompt);

const step3 = agent.getBootstrap().process('1');
console.log('\n输入"1":');
console.log(step3.prompt);

const step4 = agent.getBootstrap().process('C');
console.log('\n输入"C":');
console.log(step4.prompt);

const done = agent.getBootstrap().process('好');
console.log('\n输入"好":');
console.log(done.content);

// 4. 测试认知系统
console.log('\n4. 认知系统:');
const result = agent.getCognition().process({ type: 'task', action: 'write' });
console.log('允许:', result.allowed);
console.log('下一步:', result.nextStep);
console.log('偏好:', result.preferences);

// 5. 测试输出系统
console.log('\n5. 输出系统:');
const response = agent.getOutput().generateResponse('任务完成', 'friendly');
console.log(response.content);

// 6. 完整流程测试
console.log('\n=== 完整流程测试 ===');
agent.getEmotion().reset();
agent.getBootstrap().reset();

const result2 = agent.processUserInput('你好');
console.log('意图:', result2.intent.type);
console.log('心情:', result2.emotion.mood);
console.log('回复:', result2.response);

console.log('\n✅ 全部测试完成！');
