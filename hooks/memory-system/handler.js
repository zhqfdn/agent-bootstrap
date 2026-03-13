/**
 * Memory System Hook Handler - TypeScript 版本
 * 
 * 直接调用 TypeScript 编译后的 memory 模块
 */

const path = require('path');

// 获取插件目录
const pluginDir = __dirname;

// 配置 - 指向 dist/systems
const CONFIG = {
  memorySystemPath: path.join(pluginDir, 'dist', 'systems'),
};

/**
 * 加载 TypeScript 编译后的 MemorySystem
 */
let MemorySystem = null;

async function getMemorySystem() {
  if (!MemorySystem) {
    try {
      const module = await import(path.join(CONFIG.memorySystemPath, 'memory.js'));
      MemorySystem = module.MemorySystem || module.default;
    } catch (e) {
      console.error('[memory-system] Failed to load memory module:', e.message);
      return null;
    }
  }
  return MemorySystem;
}

/**
 * 处理 message:received - 自动保存记忆
 */
async function handleMessageReceived(event) {
  console.log('[memory-system] Auto-saving memory...');
  
  try {
    const MemoryClass = await getMemorySystem();
    if (MemoryClass) {
      const ms = new MemoryClass();
      const context = event.context || {};
      const messages = context.messages || [];
      
      // 保存最近的对话
      if (messages.length > 0) {
        const recent = messages.slice(-5);
        for (const msg of recent) {
          if (msg.role && msg.content) {
            ms.save(`[${msg.role}] ${msg.content}`, {
              type: 'episodic',
              tags: ['对话'],
            });
          }
        }
      }
      console.log('[memory-system] Memory saved');
    }
  } catch (e) {
    console.log('[memory-system] Save error:', e.message);
  }
  
  return event;
}

/**
 * 处理 session_end - 保存会话记忆
 */
async function handleSessionEnd(event) {
  console.log('[memory-system] Session end, saving context...');
  
  try {
    const MemoryClass = await getMemorySystem();
    if (MemoryClass) {
      const ms = new MemoryClass();
      const context = event.context || {};
      
      // 保存会话摘要
      if (context.summary) {
        ms.rememberThis(`会话摘要: ${context.summary}`, true);
      }
      
      console.log('[memory-system] Session memory saved');
    }
  } catch (e) {
    console.log('[memory-system] Session save error:', e.message);
  }
  
  return event;
}

/**
 * 处理 command - 搜索记忆
 */
async function handleCommand(event) {
  const action = event.action || '';
  
  if (action === 'remember' || action === '记忆') {
    try {
      const MemoryClass = await getMemorySystem();
      if (MemoryClass) {
        const ms = new MemoryClass();
        const content = event.params?.content || '';
        
        if (content) {
          ms.rememberThis(content, event.params?.important || false);
          event.response = '已记住: ' + content;
        }
      }
    } catch (e) {
      event.response = '记忆错误: ' + e.message;
    }
  }
  else if (action === 'recall' || action === '想起') {
    try {
      const MemoryClass = await getMemorySystem();
      if (MemoryClass) {
        const ms = new MemorySystem();
        const about = event.params?.about || '';
        
        event.response = ms.whatDoYouRemember(about);
      }
    } catch (e) {
      event.response = '回忆错误: ' + e.message;
    }
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[memory-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'message' || type === 'message:received') {
      await handleMessageReceived(event);
    }
    else if (type === 'session' || type === 'session:end') {
      await handleSessionEnd(event);
    }
    else if (type === 'command') {
      await handleCommand(event);
    }
  } catch (error) {
    console.error('[memory-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'memory-system',
  description: 'Memory System: auto-save conversations and context',
  events: ['session', 'message', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
