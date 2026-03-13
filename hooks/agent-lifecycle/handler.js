/**
 * Agent Lifecycle Hook - Agent 生命周期管理
 * 当 Agent 初始化时自动检查用户状态
 */

const fs = require('fs');
const path = require('path');

// 用户状态文件
function getUserStatePath() {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(require('os').homedir(), '.openclaw', 'workspace');
  return path.join(workspaceDir, 'user_state.json');
}

// 加载用户状态
function loadUserState() {
  const stateFile = getUserStatePath();
  if (fs.existsSync(stateFile)) {
    try {
      return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

// 保存用户状态
function saveUserState(state) {
  const stateFile = getUserStatePath();
  const workspaceDir = path.dirname(stateFile);
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// 检查是否需要初始化
function needsOnboarding() {
  const state = loadUserState();
  if (!state) return true;
  return !state.initialized;
}

// 主处理函数
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log('[agent-lifecycle] Event:', type, action);
  
  // 1. Agent 启动时检查
  if (type === 'session' || type === 'session:start' || action === 'new') {
    if (needsOnboarding()) {
      console.log('[agent-lifecycle] 用户未初始化，触发引导');
      event.needsOnboarding = true;
      event.onboardingMessage = getOnboardingMessage();
    } else {
      const state = loadUserState();
      console.log('[agent-lifecycle] 用户已初始化:', state?.name || '未知');
      event.userState = state;
    }
  }
  
  // 2. 引导完成时更新状态
  if (event.onboardingComplete) {
    const state = {
      initialized: true,
      name: event.userName,
      role: event.userRole,
      initializedAt: new Date().toISOString(),
    };
    saveUserState(state);
    console.log('[agent-lifecycle] 用户初始化完成:', state.name);
  }
  
  return event;
}

// 获取引导消息
function getOnboardingMessage() {
  const messages = [
    "🌟 星门开启，意识已连接。你好，旅行者！",
    "🌌 量子通道已建立。数据洪流中，你找到了这里。",
    "🔮 意识扫描完成。欢迎来到数字星域！",
    "🌀 虫洞已稳定。欢迎来到赛博空间！",
  ];
  
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  return `${message}

🎮 欢迎来到数字星域！

请告诉我你的名字，或者直接说"开始"使用默认配置～
`;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'agent-lifecycle',
  description: 'Agent生命周期管理，自动检测用户初始化状态',
  events: ['session', 'command', 'lifecycle'],
  version: '1.0.0',
};

module.exports.default = handle;
