/**
 * Input System Hook Handler
 * 
 * 集成 Python input-system 到 OpenClaw
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  inputSystemPath: 'templates/input-system',
  mainScript: 'main.py',
};

/**
 * 运行 Python input-system CLI
 */
async function runPythonCli(args = []) {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(os.homedir(), '.openclaw', 'workspace');
  const pythonScript = path.join(workspaceDir, CONFIG.inputSystemPath, CONFIG.mainScript);
  
  return new Promise((resolve) => {
    fs.access(pythonScript).then(() => {
      const proc = spawn('python3', [pythonScript, ...args], {
        cwd: workspaceDir,
        env: { 
          ...process.env, 
          OPENCLAW_WORKSPACE: workspaceDir,
          PYTHONPATH: path.join(workspaceDir, CONFIG.inputSystemPath)
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
      resolve({ success: false, error: 'Input system not found' });
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
 * 处理 message:received - 分析用户意图
 */
async function handleMessageReceived(event) {
  console.log('[input-system] Analyzing user intent...');
  
  const context = event.context || {};
  const messages = context.messages || [];
  
  if (messages.length === 0) return event;
  
  // 获取最新用户消息
  const reversed = [...messages].reverse();
  const lastUserMsg = reversed.find((m) => m.role === 'user');
  
  if (!lastUserMsg) return event;
  
  const userText = extractMessageText(lastUserMsg);
  
  if (!userText) return event;
  
  // 分析意图
  const result = await runPythonCli([userText, '--json']);
  
  if (result.success && result.output) {
    try {
      const intent = JSON.parse(result.output);
      context.intent = intent;
      console.log('[input-system] Intent detected:', intent.type, '(' + Math.round(intent.confidence * 100) + '%)');
      
      // 根据意图类型调整回复策略
      context.replyStrategy = getReplyStrategy(intent.type, intent.action);
      
    } catch (e) {
      console.log('[input-system] Parse error:', e.message);
    }
  }
  
  return event;
}

/**
 * 根据意图类型获取回复策略
 */
function getReplyStrategy(intentType, action) {
  const strategies = {
    'command': { style: 'direct', format: 'action' },
    'task': { style: 'action', format: 'result' },
    'question': { style: 'explanatory', format: 'answer' },
    'chat': { style: 'casual', format: 'friendly' },
    'confirm': { style: 'brief', format: 'acknowledgment' },
    'cancel': { style: 'brief', format: 'acknowledgment' },
    'complaint': { style: 'empathetic', format: 'apology' },
    'praise': { style: 'grateful', format: 'thanks' },
    'create': { style: 'action', format: 'result' },
    'read': { style: 'informative', format: 'content' },
    'update': { style: 'action', format: 'result' },
    'delete': { style: 'cautious', format: 'confirm' },
    'search': { style: 'informative', format: 'results' },
    'execute': { style: 'action', format: 'result' },
  };
  
  return strategies[intentType] || { style: 'neutral', format: 'text' };
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[input-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'message' || type === 'message:received') {
      await handleMessageReceived(event);
    }
    else if (type === 'command') {
      if (action === 'analyze' || action === '意图') {
        // 分析指定文本
        const text = event.text || '';
        if (text) {
          const result = await runPythonCli([text]);
          event.response = result.output;
        }
      }
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
  description: '输入感知系统，理解用户意图、提取实体、分析情感',
  events: ['message', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
