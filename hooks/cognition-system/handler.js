/**
 * Cognition System Hook Handler - TypeScript 版本
 * 
 * 直接调用 TypeScript 编译后的 cognition 模块
 */

const path = require('path');

// 获取插件目录
const pluginDir = __dirname;

// 配置 - 指向 dist/systems
const CONFIG = {
  cognitionSystemPath: path.join(pluginDir, 'dist', 'systems'),
};

/**
 * 加载 TypeScript 编译后的 CognitionSystem
 */
let CognitionSystem = null;

async function getCognitionSystem() {
  if (!CognitionSystem) {
    try {
      const module = await import(path.join(CONFIG.cognitionSystemPath, 'cognition.js'));
      CognitionSystem = module.CognitionSystem || module.default;
    } catch (e) {
      console.error('[cognition-system] Failed to load cognition module:', e.message);
      return null;
    }
  }
  return CognitionSystem;
}

/**
 * 处理 message:received - 更新认知上下文
 */
async function handleMessageReceived(event) {
  console.log('[cognition-system] Updating cognition context...');
  
  try {
    const CognitionClass = await getCognitionSystem();
    if (CognitionClass) {
      const cognition = new CognitionClass();
      const context = event.context || {};
      const messages = context.messages || [];
      
      cognition.updateFromContext(messages);
      console.log('[cognition-system] Context updated');
    }
  } catch (e) {
    console.log('[cognition-system] Update error:', e.message);
  }
  
  return event;
}

/**
 * 处理 agent:before - 推理规划
 */
async function handleBeforeAgent(event) {
  console.log('[cognition-system] Reasoning and planning...');
  
  try {
    const CognitionClass = await getCognitionSystem();
    if (CognitionClass) {
      const cognition = new CognitionClass();
      const context = event.context || {};
      
      // 可以在这里进行任务分解、决策等
      // 目前是占位符
      
      console.log('[cognition-system] Reasoning completed');
    }
  } catch (e) {
    console.log('[cognition-system] Reasoning error:', e.message);
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  
  console.log(`[cognition-system] Event: ${type}`);
  
  try {
    if (type === 'message' || type === 'message:received') {
      await handleMessageReceived(event);
    }
    else if (type === 'agent' || type === 'agent:before') {
      await handleBeforeAgent(event);
    }
  } catch (error) {
    console.error('[cognition-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'cognition-system',
  description: 'Cognition System: reasoning, planning, task decomposition',
  events: ['message', 'agent'],
  version: '1.0.0',
};

module.exports.default = handle;
