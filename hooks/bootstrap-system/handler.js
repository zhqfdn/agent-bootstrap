/**
 * Bootstrap System Hook Handler
 * 
 * 集成 Python bootstrap-system 到 OpenClaw
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  bootstrapSystemPath: 'templates/bootstrap-system',
  mainScript: 'main.py',
};

/**
 * 运行 Python bootstrap-system CLI
 */
async function runPythonCli(args = []) {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(os.homedir(), '.openclaw', 'workspace');
  const pythonScript = path.join(workspaceDir, CONFIG.bootstrapSystemPath, CONFIG.mainScript);
  
  return new Promise((resolve) => {
    fs.access(pythonScript).then(() => {
      const proc = spawn('python3', [pythonScript, ...args], {
        cwd: workspaceDir,
        env: { 
          ...process.env, 
          OPENCLAW_WORKSPACE: workspaceDir,
          PYTHONPATH: path.join(workspaceDir, CONFIG.bootstrapSystemPath)
        }
      });
      
      let output = '';
      let error = '';
      
      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { error += data.toString(); });
      
      proc.on('close', (code) => {
        resolve({ success: code === 0, output, error });
      });
      
      proc.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
      
    }).catch(() => {
      resolve({ success: false, error: 'Bootstrap system not found' });
    });
  });
}

/**
 * 从会话消息中提取文本内容
 */
function extractMessageText(message) {
  if (!message || !message.content) return '';
  
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  if (Array.isArray(message.content)) {
    return message.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text || '')
      .join('');
  }
  
  return '';
}

/**
 * 处理 session_start - 检查是否需要引导
 */
async function handleSessionStart(event) {
  console.log('[bootstrap-system] Checking bootstrap status...');
  
  const result = await runPythonCli(['status', '--json']);
  
  if (result.success && result.output) {
    try {
      const status = JSON.parse(result.output);
      event.context = event.context || {};
      event.context.bootstrap = status;
      
      if (!status.is_completed && status.status === 'not_started') {
        // 需要开始引导
        event.needsBootstrap = true;
        console.log('[bootstrap-system] Bootstrap needed');
      } else if (status.is_completed) {
        console.log('[bootstrap-system] Bootstrap already completed');
      }
    } catch (e) {
      console.log('[bootstrap-system] Parse error:', e.message);
    }
  }
  
  return event;
}

/**
 * 处理 bootstrap 命令
 */
async function handleBootstrapCommand(event) {
  const action = event.action;
  const input = event.input || '';
  
  if (action === 'start' || action === 'begin') {
    // 开始引导
    const result = await runPythonCli(['start']);
    event.response = result.output;
  }
  else if (action === 'step') {
    // 查看当前步骤
    const result = await runPythonCli(['step']);
    event.response = result.output;
  }
  else if (action === 'submit' || action === 'next') {
    // 提交输入
    const result = await runPythonCli(['submit', input]);
    event.response = result.output;
    
    // 检查是否完成
    if (result.output.includes('初始化完成') || result.output.includes('completed')) {
      event.bootstrapCompleted = true;
    }
  }
  else if (action === 'status') {
    // 查看状态
    const result = await runPythonCli(['status']);
    event.response = result.output;
  }
  else if (action === 'reset') {
    // 重置
    const result = await runPythonCli(['reset']);
    event.response = '✓ 引导已重置，请重新开始';
  }
  
  return event;
}

/**
 * 处理用户消息 - 检查是否是引导输入
 */
async function handleMessage(event) {
  const context = event.context || {};
  
  // 检查是否正在进行引导
  if (context.bootstrap && context.bootstrap.status === 'in_progress') {
    const messages = context.messages || [];
    const reversed = [...messages].reverse();
    const lastUserMsg = reversed.find((m) => m.role === 'user');
    
    if (lastUserMsg) {
      const userText = extractMessageText(lastUserMsg);
      
      if (userText && !userText.startsWith('/')) {
        // 提交作为引导输入
        console.log('[bootstrap-system] Submitting bootstrap input:', userText.substring(0, 20));
        const result = await runPythonCli(['submit', userText]);
        
        event.bootstrapResponse = result.output;
        
        if (result.output.includes('初始化完成') || result.output.includes('completed')) {
          event.bootstrapCompleted = true;
        }
      }
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
  
  console.log(`[bootstrap-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'session' || type === 'session:start') {
      await handleSessionStart(event);
    }
    else if (type === 'message' || type === 'message:received') {
      await handleMessage(event);
    }
    else if (type === 'command') {
      // 处理引导命令
      if (action === 'bootstrap' || action === '引导' || action === '开始') {
        await handleBootstrapCommand(event);
      }
      else if (['start', 'step', 'submit', 'status', 'reset'].includes(action)) {
        await handleBootstrapCommand(event);
      }
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
  description: '初始化引导系统，交互式收集用户配置、塑造Agent人格',
  events: ['session', 'message', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
