/**
 * Output System Hook Handler - TypeScript 版本
 * 
 * 直接调用 TypeScript 编译后的 output 模块
 */

const path = require('path');

// 获取插件目录
const pluginDir = __dirname;

// 配置 - 指向 dist/systems
const CONFIG = {
  outputSystemPath: path.join(pluginDir, 'dist', 'systems'),
};

/**
 * 加载 TypeScript 编译后的 OutputSystem
 */
let OutputSystem = null;

async function getOutputSystem() {
  if (!OutputSystem) {
    try {
      const module = await import(path.join(CONFIG.outputSystemPath, 'output.js'));
      OutputSystem = module.OutputSystem || module.default;
    } catch (e) {
      console.error('[output-system] Failed to load output module:', e.message);
      return null;
    }
  }
  return OutputSystem;
}

/**
 * 处理 agent:before - 准备输出
 */
async function handleBeforeAgent(event) {
  console.log('[output-system] Preparing output...');
  
  try {
    const OutputClass = await getOutputSystem();
    if (OutputClass) {
      const outputSystem = new OutputClass();
      const context = event.context || {};
      
      // 应用输出格式化
      context.outputStyle = context.outputStyle || 'direct';
      
      event.context = context;
      console.log('[output-system] Output prepared, style:', context.outputStyle);
    }
  } catch (e) {
    console.log('[output-system] Prepare error:', e.message);
  }
  
  return event;
}

/**
 * 处理 agent:end - 收集反馈
 */
async function handleAgentEnd(event) {
  console.log('[output-system] Collecting feedback...');
  
  try {
    const OutputClass = await getOutputSystem();
    if (OutputClass) {
      const outputSystem = new OutputClass();
      const response = event.response;
      
      if (response) {
        // 可以在这里记录输出统计
        console.log('[output-system] Response sent, length:', response.length);
      }
    }
  } catch (e) {
    console.log('[output-system] Feedback error:', e.message);
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[output-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'agent' || type === 'agent:before') {
      await handleBeforeAgent(event);
    }
    else if (type === 'agent' || type === 'agent:end') {
      await handleAgentEnd(event);
    }
  } catch (error) {
    console.error('[output-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'output-system',
  description: 'Output System: format and execute agent output',
  events: ['agent'],
  version: '1.0.0',
};

module.exports.default = handle;
