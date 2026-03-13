/**
 * Auto Bootstrap Hook - 自动引导系统
 * 当 Agent 首次与用户交互时，自动检查并启动引导流程
 * 支持全局和 Agent 级别初始化
 */

const fs = require('fs');
const path = require('path');

// 检查是否需要引导
function needsBootstrap(agentId = 'default') {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(require('os').homedir(), '.openclaw', 'workspace');
  
  // 1. 检查全局配置
  const globalIdentity = path.join(workspaceDir, 'IDENTITY.md');
  
  // 2. 检查 Agent 专用配置
  const agentIdentity = path.join(workspaceDir, 'agents', agentId, 'IDENTITY.md');
  
  // 先检查全局
  if (fs.existsSync(globalIdentity)) {
    const content = fs.readFileSync(globalIdentity, 'utf-8');
    if (content.includes('name:') && content.includes('role:')) {
      return false; // 全局已配置
    }
  }
  
  // 再检查 Agent 专用
  if (fs.existsSync(agentIdentity)) {
    const content = fs.readFileSync(agentIdentity, 'utf-8');
    if (content.includes('name:') && content.includes('role:')) {
      return false; // Agent 已配置
    }
  }
  
  return true; // 需要引导
}

// 获取引导状态
function getBootstrapState(agentId = 'default') {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(require('os').homedir(), '.openclaw', 'workspace');
  
  // Agent 专用状态
  const agentStateFile = path.join(workspaceDir, 'agents', agentId, 'bootstrap_state.json');
  
  if (fs.existsSync(agentStateFile)) {
    try {
      return JSON.parse(fs.readFileSync(agentStateFile, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  
  // 全局状态
  const globalStateFile = path.join(workspaceDir, 'bootstrap_state.json');
  if (fs.existsSync(globalStateFile)) {
    try {
      return JSON.parse(fs.readFileSync(globalStateFile, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

// 保存引导状态
function saveBootstrapState(state, agentId = 'default') {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(require('os').homedir(), '.openclaw', 'workspace');
  
  const agentDir = path.join(workspaceDir, 'agents', agentId);
  if (!fs.existsSync(agentDir)) {
    fs.mkdirSync(agentDir, { recursive: true });
  }
  
  const stateFile = path.join(agentDir, 'bootstrap_state.json');
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// 获取 Agent ID
function getAgentId(event) {
  // 从事件中获取 Agent ID
  return event.agentId || event.agent || 'default';
}

// 处理事件
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  const agentId = getAgentId(event);
  
  console.log('[auto-bootstrap] Event:', type, action, 'Agent:', agentId);
  
  // 只处理会话开始或新会话
  if (type === 'session' || type === 'session:start' || action === 'new' || action === 'create') {
    if (needsBootstrap(agentId)) {
      console.log('[auto-bootstrap] 需要引导，Agent:', agentId);
      
      // 设置需要引导的标记
      event.needsBootstrap = true;
      event.bootstrapAgentId = agentId;
      event.bootstrapAuto = true;
      
      // 返回引导消息
      const messages = [
        "🌟 星门开启，意识已连接。你好，旅行者！",
        "🌌 量子通道已建立。数据洪流中，你找到了这里。",
        "🔮 意识扫描完成。欢迎来到数字星域！",
        "🌀 虫洞已稳定。欢迎来到赛博空间！",
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      event.response = `${message}

🎮 欢迎来到数字星域！

你是第一次使用这个 Agent 吗？

【请回复你的名字】或者直接说"开始"使用默认配置～
`;
    } else {
      const state = getBootstrapState(agentId);
      if (state && state.name) {
        console.log('[auto-bootstrap] Agent 已初始化:', agentId, state.name);
        event.agentName = state.name;
      }
    }
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'auto-bootstrap',
  description: '自动引导系统，检测未初始化用户并启动引导流程，支持全局和Agent级别',
  events: ['session', 'command', 'lifecycle'],
  version: '1.0.0',
};

module.exports.default = handle;
