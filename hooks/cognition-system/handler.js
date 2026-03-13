/**
 * Cognition System Hook Handler
 * 
 * 集成 Python cognition-system 到 OpenClaw
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  cognitionSystemPath: 'templates/cognition-system',
  mainScript: 'main.py',
};

/**
 * 运行 Python cognition-system CLI
 */
async function runPythonCli(args = []) {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(os.homedir(), '.openclaw', 'workspace');
  const pythonScript = path.join(workspaceDir, CONFIG.cognitionSystemPath, CONFIG.mainScript);
  
  return new Promise((resolve) => {
    fs.access(pythonScript).then(() => {
      const proc = spawn('python3', [pythonScript, ...args], {
        cwd: workspaceDir,
        env: { 
          ...process.env, 
          OPENCLAW_WORKSPACE: workspaceDir,
          PYTHONPATH: path.join(workspaceDir, CONFIG.cognitionSystemPath)
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
      resolve({ success: false, error: 'Cognition system not found' });
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
 * 处理 message:received - 认知处理
 */
async function handleMessageReceived(event) {
  console.log('[cognition-system] Processing with cognition...');
  
  const context = event.context || {};
  const messages = context.messages || [];
  
  if (messages.length === 0) return event;
  
  // 获取最新用户消息
  const reversed = [...messages].reverse();
  const lastUserMsg = reversed.find((m) => m.role === 'user');
  
  if (!lastUserMsg) return event;
  
  const userText = extractMessageText(lastUserMsg);
  
  if (!userText || userText.startsWith('/')) return event;
  
  // 获取已分析的意图（来自 input-system）
  const intent = context.intent || {};
  
  if (intent.type) {
    // 使用认知系统处理
    const result = await runPythonCli(['process', JSON.stringify({
      action: intent.action || intent.type,
      type: intent.type,
    }), '--json']);
    
    if (result.success && result.output) {
      try {
        const cognitionResult = JSON.parse(result.output);
        context.cognition = cognitionResult;
        
        // 根据任务步骤调整回复策略
        if (cognitionResult.allowed && cognitionResult.next_step) {
          context.replyStrategy = {
            ...context.replyStrategy,
            task: cognitionResult.task,
            nextStep: cognitionResult.next_step,
          };
        }
        
        console.log('[cognition-system] Cognition result:', cognitionResult.allowed ? 'allowed' : 'denied');
      } catch (e) {
        console.log('[cognition-system] Parse error:', e.message);
      }
    }
  }
  
  return event;
}

/**
 * 处理 feedback 命令
 */
async function handleFeedback(event) {
  const feedback = event.feedback || event.text || '';
  
  if (feedback) {
    const result = await runPythonCli(['learn', feedback]);
    console.log('[cognition-system] Learning:', feedback);
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[cognition-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'message' || type === 'message:received') {
      await handleMessageReceived(event);
    }
    else if (type === 'command') {
      if (action === 'learn' || action === 'feedback') {
        await handleFeedback(event);
      }
      else if (action === 'cognition' || action === 'status') {
        const result = await runPythonCli(['status', '--json']);
        if (result.success) {
          event.response = result.output;
        }
      }
    }
  } catch (error) {
    console.error('[cognition-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'cognition-system',
  description: '认知系统，推理规划、任务分解、学习适应、决策判断',
  events: ['message', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
