/**
 * Memory System Hook Handler
 * 
 * 集成 Python memory-system 到 OpenClaw
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  memorySystemPath: 'templates/memory-system',
  cliScript: 'cli.py',
};

/**
 * 运行 Python memory-system CLI
 */
async function runPythonCli(args) {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(os.homedir(), '.openclaw', 'workspace');
  const pythonScript = path.join(workspaceDir, CONFIG.memorySystemPath, CONFIG.cliScript);
  
  return new Promise((resolve) => {
    fs.access(pythonScript).then(() => {
      const proc = spawn('python3', [pythonScript, ...args], {
        cwd: workspaceDir,
        env: { 
          ...process.env, 
          OPENCLAW_WORKSPACE: workspaceDir,
          PYTHONPATH: path.join(workspaceDir, CONFIG.memorySystemPath)
        }
      });
      
      let output = '';
      let error = '';
      
      proc.stdout.on('data', (data) => { output += data.toString(); });
      proc.stderr.on('data', (data) => { error += data.toString(); });
      
      proc.on('close', (code) => {
        try {
          if (output) {
            const result = JSON.parse(output);
            resolve(result);
          } else {
            resolve({ success: false, error: 'No output' });
          }
        } catch (e) {
          resolve({ success: false, error: error || 'Parse error' });
        }
      });
      
      proc.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
      
    }).catch(() => {
      resolve({ success: false, error: 'Memory system not found' });
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
 * 生成上下文摘要
 */
function formatContextSummary(data) {
  if (!data || !data.success || !data.context) return '';
  
  const { context } = data;
  const lines = [];
  
  if (context.preferences) {
    const p = context.preferences;
    if (p.userName || p.agentName) {
      lines.push(`【用户信息】名字: ${p.userName || p.agentName || '未知'}`);
    }
  }
  
  if (context.recent_memories && context.recent_memories.length > 0) {
    lines.push('【近期记忆】');
    context.recent_memories.slice(0, 3).forEach((m) => {
      const content = m.content ? m.content.substring(0, 50) : '';
      const date = m.created_at ? m.created_at.substring(0, 10) : '';
      lines.push(`  - [${date}] ${content}...`);
    });
  }
  
  return lines.length > 0 ? '\n' + lines.join('\n') : '';
}

/**
 * 处理 session_start
 */
async function handleSessionStart(event) {
  console.log('[memory-system] Session start, loading context...');
  
  const context = event.context || {};
  const result = await runPythonCli(['get_context']);
  
  if (result.success && result.context) {
    const summary = formatContextSummary(result);
    if (summary) {
      if (!context.prependContext) context.prependContext = '';
      context.prependContext += '\n\n--- 记忆系统 ---\n' + summary;
      console.log('[memory-system] Context injected successfully');
    }
  } else {
    console.log('[memory-system] No context to load:', result.error);
  }
  
  event.context = context;
}

/**
 * 处理 agent_end
 */
async function handleAgentEnd(event) {
  console.log('[memory-system] Agent end, saving conversation...');
  
  const context = event.context || {};
  const messages = context.messages || [];
  
  if (messages.length === 0) return;
  
  const reversed = [...messages].reverse();
  const lastUserMsg = reversed.find((m) => m.role === 'user');
  const lastAssistantMsg = reversed.find((m) => m.role === 'assistant');
  
  if (lastUserMsg) {
    const userText = extractMessageText(lastUserMsg);
    const assistantText = lastAssistantMsg ? extractMessageText(lastAssistantMsg) : '';
    
    if (userText && userText.length < 1000 && !userText.startsWith('/')) {
      const content = `用户: ${userText}\n助手: ${assistantText}`;
      const result = await runPythonCli(['save', content, 'episodic', '对话', '0.3']);
      
      if (result.success) {
        console.log('[memory-system] Conversation saved:', result.memory_id);
      } else {
        console.log('[memory-system] Save failed:', result.error);
      }
    }
  }
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[memory-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'command') {
      if (action === 'new' || action === 'reset') {
        await handleAgentEnd(event);
      }
    }
    else if (type === 'lifecycle' || type === 'lifecycle:end') {
      if (action === 'end' || action === '') {
        await handleAgentEnd(event);
      }
    }
    else if (type === 'session' || type === 'session:start') {
      if (action === 'start' || action === '') {
        await handleSessionStart(event);
      }
    }
    else if (type === 'message' || type === 'message:received') {
      await handleMessageReceived(event);
    }
  } catch (error) {
    console.error('[memory-system] Handler error:', error.message);
  }
}

// 默认导出
module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'memory-system',
  description: '集成记忆系统，自动保存对话和加载历史上下文',
  events: ['command', 'lifecycle', 'session'],
  version: '1.0.0',
};

// 也导出 default 兼容
module.exports.default = handle;
