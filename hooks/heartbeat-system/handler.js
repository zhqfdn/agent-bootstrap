/**
 * Heartbeat System Hook Handler - TypeScript 版本
 * 
 * 直接调用 TypeScript 编译后的 heartbeat 模块
 */

const path = require('path');

// 获取插件目录
const pluginDir = __dirname;

// 配置 - 指向 dist/systems
const CONFIG = {
  heartbeatSystemPath: path.join(pluginDir, 'dist', 'systems'),
};

/**
 * 加载 TypeScript 编译后的 HeartbeatSystem
 */
let HeartbeatSystem = null;

async function getHeartbeatSystem() {
  if (!HeartbeatSystem) {
    try {
      const module = await import(path.join(CONFIG.heartbeatSystemPath, 'heartbeat.js'));
      HeartbeatSystem = module.HeartbeatSystem || module.default;
    } catch (e) {
      console.error('[heartbeat-system] Failed to load heartbeat module:', e.message);
      return null;
    }
  }
  return HeartbeatSystem;
}

/**
 * 处理 heartbeat / pulse 事件
 */
async function handleHeartbeat(event) {
  console.log('[heartbeat-system] Heartbeat pulse, running tasks...');
  
  try {
    const HeartbeatClass = await getHeartbeatSystem();
    if (HeartbeatClass) {
      const hb = new HeartbeatClass();
      await hb.tick();
      console.log('[heartbeat-system] Tasks completed');
    }
  } catch (e) {
    console.log('[heartbeat-system] Tasks error:', e.message);
  }
  
  return event;
}

/**
 * 处理 status 命令
 */
async function handleStatus(event) {
  try {
    const HeartbeatClass = await getHeartbeatSystem();
    if (HeartbeatClass) {
      const hb = new HeartbeatClass();
      const status = hb.getStatus();
      event.response = JSON.stringify(status, null, 2);
    }
  } catch (e) {
    event.response = 'Heartbeat system error: ' + e.message;
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[heartbeat-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'heartbeat' || type === 'pulse') {
      await handleHeartbeat(event);
    }
    else if (type === 'command') {
      if (action === 'heartbeat' || action === 'status') {
        await handleStatus(event);
      }
    }
  } catch (error) {
    console.error('[heartbeat-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'heartbeat-system',
  description: 'Heartbeat System: periodic tasks for emotion decay, state saving, cleanup',
  events: ['heartbeat', 'pulse', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
