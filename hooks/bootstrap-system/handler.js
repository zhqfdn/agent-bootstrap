/**
 * Bootstrap System Hook Handler - TypeScript 版本
 * 
 * 直接调用 TypeScript 编译后的 bootstrap 模块
 */

const path = require('path');
const fs = require('fs');

// 获取插件目录
const pluginDir = __dirname;

// 配置 - 指向 dist/systems
const CONFIG = {
  bootstrapSystemPath: path.join(pluginDir, '..', '..', 'dist', 'systems'),
};

/**
 * 加载 TypeScript 编译后的 BootstrapEngine
 */
let BootstrapEngine = null;

async function getBootstrapEngine() {
  if (!BootstrapEngine) {
    try {
      const module = await import(path.join(CONFIG.bootstrapSystemPath, 'bootstrap.js'));
      BootstrapEngine = module.BootstrapEngine || module.default;
    } catch (e) {
      console.error('[bootstrap-system] Failed to load bootstrap module:', e.message);
      return null;
    }
  }
  return BootstrapEngine;
}

/**
 * 检查是否需要引导
 */
async function checkBootstrap(event) {
  console.log('[bootstrap-system] Checking bootstrap status...');
  
  try {
    const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
      path.join(process.env.HOME || '', '.openclaw', 'workspace');
    
    // 检查关键文件是否存在
    const requiredFiles = ['IDENTITY.md', 'SOUL.md', 'USER.md'];
    const missing = requiredFiles.filter(f => 
      !fs.existsSync(path.join(workspaceDir, f))
    );
    
    if (missing.length > 0) {
      console.log('[bootstrap-system] Bootstrap needed, missing:', missing);
      event.needsBootstrap = true;
      event.bootstrapFiles = missing;
    } else {
      console.log('[bootstrap-system] Bootstrap not needed');
      event.needsBootstrap = false;
    }
  } catch (e) {
    console.log('[bootstrap-system] Check error:', e.message);
  }
  
  return event;
}

/**
 * 处理 bootstrap:start - 开始引导
 */
async function handleBootstrapStart(event) {
  console.log('[bootstrap-system] Starting bootstrap...');
  
  try {
    const BootstrapClass = await getBootstrapEngine();
    if (BootstrapClass) {
      const bootstrap = new BootstrapEngine();
      const context = await bootstrap.start();
      
      event.bootstrapContext = context;
      console.log('[bootstrap-system] Bootstrap started');
    }
  } catch (e) {
    console.log('[bootstrap-system] Bootstrap error:', e.message);
  }
  
  return event;
}

/**
 * 处理 bootstrap:complete - 引导完成
 */
async function handleBootstrapComplete(event) {
  console.log('[bootstrap-system] Bootstrap completed...');
  
  try {
    const BootstrapClass = await getBootstrapEngine();
    if (BootstrapClass) {
      const bootstrap = new BootstrapEngine();
      await bootstrap.complete(event.bootstrapData);
      
      console.log('[bootstrap-system] Bootstrap completed');
    }
  } catch (e) {
    console.log('[bootstrap-system] Complete error:', e.message);
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[bootstrap-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'session' || type === 'session:start') {
      await checkBootstrap(event);
    }
    else if (type === 'bootstrap' || type === 'bootstrap:start') {
      await handleBootstrapStart(event);
    }
    else if (type === 'bootstrap' || type === 'bootstrap:complete') {
      await handleBootstrapComplete(event);
    }
  } catch (error) {
    console.error('[bootstrap-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'bootstrap-system',
  description: 'Bootstrap System: interactive agent initialization and configuration',
  events: ['session', 'bootstrap'],
  version: '1.0.0',
};

module.exports.default = handle;
