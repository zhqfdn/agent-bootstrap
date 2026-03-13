/**
 * Input System Hook Handler - TypeScript 版本
 * 
 * 直接调用 TypeScript 编译后的 input 模块
 */

const path = require('path');

// 获取插件目录
const pluginDir = __dirname;

// 配置 - 指向 dist/systems
const CONFIG = {
  inputSystemPath: path.join(pluginDir, 'dist', 'systems'),
};

/**
 * 加载 TypeScript 编译后的 InputAnalyzer
 */
let InputAnalyzer = null;

async function getInputAnalyzer() {
  if (!InputAnalyzer) {
    try {
      const module = await import(path.join(CONFIG.inputSystemPath, 'input.js'));
      InputAnalyzer = module.InputAnalyzer || module.default;
    } catch (e) {
      console.error('[input-system] Failed to load input module:', e.message);
      return null;
    }
  }
  return InputAnalyzer;
}

/**
 * 处理 message:received - 分析用户意图
 */
async function handleMessageReceived(event) {
  console.log('[input-system] Analyzing input intent...');
  
  try {
    const InputClass = await getInputAnalyzer();
    if (InputClass) {
      const analyzer = new InputClass();
      const context = event.context || {};
      const messages = context.messages || [];
      
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'user' && lastMsg.content) {
          const intent = analyzer.analyze(lastMsg.content);
          
          context.intent = intent;
          event.context = context;
          
          console.log('[input-system] Intent:', intent.type, intent.confidence);
        }
      }
    }
  } catch (e) {
    console.log('[input-system] Analyze error:', e.message);
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  
  console.log(`[input-system] Event: ${type}`);
  
  try {
    if (type === 'message' || type === 'message:received') {
      await handleMessageReceived(event);
    }
  } catch (error) {
    console.error('[input-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'input-system',
  description: 'Input System: analyze user intent and entities',
  events: ['message'],
  version: '1.0.0',
};

module.exports.default = handle;
