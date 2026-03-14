/**
 * Agent Init Hook - Agent 初始化系统
 * 监听 command:new 和 command:reset 事件
 * 检测并复制模板到 Agent workspace
 */

const fs = require('fs');
const path = require('path');

// 获取插件目录
const pluginDir = path.join(__dirname, '..', '..');

// 模板目录（插件目录）
const TEMPLATE_DIR = path.join(pluginDir, 'agent-templates');

// 需要复制的模板文件列表
const TEMPLATE_FILES = [
  'AGENTS.md',
  'SOUL.md', 
  'MEMORY.md',
  'IDENTITY.md',
  'USER.md',
  'TOOLS.md',
  'BOOTSTRAP.md',
  'HEARTBEAT.md'
];

/**
 * 获取 Agent workspace 目录
 */
function getAgentWorkspace(event) {
  // 优先使用 event 提供的 workspaceDir
  if (event.context?.workspaceDir) {
    return event.context.workspaceDir;
  }
  
  // 从 sessionKey 解析
  const sessionKey = event.sessionKey || '';
  const parts = sessionKey.split(':');
  
  // 默认 workspace
  const defaultWorkspace = path.join(
    require('os').homedir(),
    '.openclaw',
    'workspace'
  );
  
  // 如果有 agent ID，构建对应的 workspace
  if (parts.length >= 2 && parts[1]) {
    const agentId = parts[1].split('-')[0]; // e.g., "main" from "main:main"
    if (agentId && agentId !== 'default') {
      return path.join(
        require('os').homedir(),
        '.openclaw',
        `workspace-${agentId}`
      );
    }
  }
  
  return defaultWorkspace;
}

/**
 * 检查模板文件是否存在
 */
function checkTemplateExists(workspaceDir) {
  const identityPath = path.join(workspaceDir, 'IDENTITY.md');
  return fs.existsSync(identityPath);
}

/**
 * 复制模板文件到 workspace
 */
async function copyTemplates(workspaceDir, forceOverwrite = false) {
  const results = {
    copied: [],
    skipped: [],
    errors: []
  };
  
  // 确保 workspace 目录存在
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }
  
  // 确保 memory 目录存在
  const memoryDir = path.join(workspaceDir, 'memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  
  // 复制每个模板文件
  for (const templateFile of TEMPLATE_FILES) {
    const srcPath = path.join(TEMPLATE_DIR, templateFile);
    const destPath = path.join(workspaceDir, templateFile);
    
    try {
      // 检查是否需要复制
      if (!forceOverwrite && fs.existsSync(destPath)) {
        results.skipped.push(templateFile);
        console.log(`[agent-init] 跳过（已存在）: ${templateFile}`);
        continue;
      }
      
      // 检查源文件是否存在
      if (!fs.existsSync(srcPath)) {
        results.errors.push(`源文件不存在: ${templateFile}`);
        console.log(`[agent-init] 警告: 源文件不存在 ${templateFile}`);
        continue;
      }
      
      // 复制文件
      fs.copyFileSync(srcPath, destPath);
      results.copied.push(templateFile);
      console.log(`[agent-init] ✅ 复制: ${templateFile}`);
      
    } catch (err) {
      results.errors.push(`${templateFile}: ${err.message}`);
      console.error(`[agent-init] ❌ 复制失败 ${templateFile}:`, err.message);
    }
  }
  
  return results;
}

/**
 * 处理 command 事件
 */
async function handleCommandEvent(event) {
  const action = event.action;
  const isReset = action === 'reset';
  const isNew = action === 'new';
  
  if (!isReset && !isNew) {
    return; // 不处理其他命令
  }
  
  const workspaceDir = getAgentWorkspace(event);
  const needsInit = !checkTemplateExists(workspaceDir);
  
  console.log(`[agent-init] 收到 ${action} 事件`);
  console.log(`[agent-init] Workspace: ${workspaceDir}`);
  console.log(`[agent-init] 需要初始化: ${needsInit}`);
  console.log(`[agent-init] 强制覆盖: ${isReset}`);
  
  // 对于 reset 事件，总是强制覆盖
  // 对于 new 事件，只在需要时复制
  if (isReset || needsInit) {
    const results = await copyTemplates(workspaceDir, isReset);
    
    // 将结果附加到事件中
    event.agentInitResults = results;
    event.agentInitWorkspace = workspaceDir;
    event.agentInitAction = action;
    
    console.log(`[agent-init] 复制完成: ${results.copied.length} 个文件`);
    if (results.skipped.length > 0) {
      console.log(`[agent-init] 跳过: ${results.skipped.length} 个文件`);
    }
    if (results.errors.length > 0) {
      console.error(`[agent-init] 错误: ${results.errors.join(', ')}`);
    }
  } else {
    console.log(`[agent-init] Workspace 已初始化，跳过复制`);
  }
  
  return event;
}

/**
 * 主处理函数
 */
async function handle(event) {
  const type = event.type;
  const action = event.action;
  
  console.log(`[agent-init] 收到事件: type=${type}, action=${action}`);
  
  // 只处理 command 类型的事件
  if (type === 'command') {
    await handleCommandEvent(event);
  }
  
  return event;
}

// 导出
module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'agent-init',
  description: 'Agent 初始化系统，监听 command:new 和 command:reset 事件，复制模板到 workspace',
  version: '1.0.0',
  events: ['command:new', 'command:reset']
};

module.exports.default = handle;
