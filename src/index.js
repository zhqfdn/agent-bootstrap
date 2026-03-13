/**
 * OpenClaw Agent System Plugin
 * 
 * 完整的 Agent 模板系统插件
 * 包含：记忆、情感、心跳、输入、认知、输出、引导
 */

const path = require('path');
const fs = require('fs');

// 配置
const PLUGIN_CONFIG = {
  id: 'agent-system',
  name: 'Agent System',
  version: '1.0.0',
  
  // 各个子系统的路径
  systems: {
    memory: 'templates/memory-system',
    emotion: 'templates/emotion-system',
    heartbeat: 'templates/heartbeat-system',
    input: 'templates/input-system',
    cognition: 'templates/cognition-system',
    output: 'templates/output-system',
    bootstrap: 'templates/bootstrap-system',
  },
  
  // Hook 目录
  hooksDir: 'hooks',
};

// 加载 Hook
async function loadHooks() {
  const hooks = {};
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(require('os').homedir(), '.openclaw', 'workspace');
  
  for (const [name, relPath] of Object.entries(PLUGIN_CONFIG.systems)) {
    const hookPath = path.join(workspaceDir, relPath.replace('templates/', 'hooks/'));
    const handlerPath = path.join(hookPath, 'handler.js');
    
    try {
      if (fs.existsSync(handlerPath)) {
        hooks[name] = require(handlerPath);
        console.log(`[agent-system] Loaded hook: ${name}`);
      }
    } catch (e) {
      console.log(`[agent-system] Hook not found: ${name}`);
    }
  }
  
  return hooks;
}

// 插件主入口
async function plugin(context) {
  console.log('[agent-system] Agent System Plugin loaded');
  
  // 加载所有 Hook
  const hooks = await loadHooks();
  
  // 返回插件 API
  return {
    // 插件信息
    info: {
      id: PLUGIN_CONFIG.id,
      name: PLUGIN_CONFIG.name,
      version: PLUGIN_CONFIG.version,
      systems: Object.keys(hooks),
    },
    
    // 获取指定系统
    getSystem(name) {
      return hooks[name];
    },
    
    // 获取所有系统
    getAllSystems() {
      return hooks;
    },
    
    // 便捷方法：获取情感状态
    async getEmotionState() {
      const hook = hooks.emotion;
      if (hook && hook.getEmotionState) {
        return await hook.getEmotionState();
      }
      return null;
    },
    
    // 便捷方法：获取引导状态
    async getBootstrapStatus() {
      const hook = hooks.bootstrap;
      if (hook) {
        // 调用引导系统
        return { status: 'available' };
      }
      return null;
    },
  };
}

// 导出
module.exports = plugin;
module.exports.default = plugin;
module.exports.metadata = {
  id: PLUGIN_CONFIG.id,
  name: PLUGIN_CONFIG.name,
  version: PLUGIN_CONFIG.version,
  description: '完整的 Agent 模板系统',
  systems: Object.keys(PLUGIN_CONFIG.systems),
};
