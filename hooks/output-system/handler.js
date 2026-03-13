/**
 * Output System Hook Handler
 * 
 * 集成 Python output-system 到 OpenClaw
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  outputSystemPath: 'templates/output-system',
  mainScript: 'main.py',
};

/**
 * 运行 Python output-system CLI
 */
async function runPythonCli(args = []) {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(os.homedir(), '.openclaw', 'workspace');
  const pythonScript = path.join(workspaceDir, CONFIG.outputSystemPath, CONFIG.mainScript);
  
  return new Promise((resolve) => {
    fs.access(pythonScript).then(() => {
      const proc = spawn('python3', [pythonScript, ...args], {
        cwd: workspaceDir,
        env: { 
          ...process.env, 
          OPENCLAW_WORKSPACE: workspaceDir,
          PYTHONPATH: path.join(workspaceDir, CONFIG.outputSystemPath)
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
      resolve({ success: false, error: 'Output system not found' });
    });
  });
}

/**
 * 格式化输出
 */
function formatOutput(content, context) {
  const style = context?.replyStrategy?.style || 'friendly';
  const format = context?.replyStrategy?.format || 'text';
  
  // 附加情感状态
  let emotionLine = '';
  if (context?.emotionState) {
    const e = context.emotionState;
    emotionLine = `\n${e.mood_emoji || '🧐'} Lv.${e.level} | ⚡${Math.round(e.energy*100)}% | 💕${Math.round(e.connection*100)}%`;
  }
  
  return content + emotionLine;
}

/**
 * 处理 agent_start - 准备输出
 */
async function handleAgentStart(event) {
  console.log('[output-system] Preparing output...');
  
  const context = event.context || {};
  
  // 获取回复策略
  const strategy = context.replyStrategy || {};
  
  // 准备输出格式
  context.outputConfig = {
    style: strategy.style || 'friendly',
    format: strategy.format || 'text',
    includeEmotion: true,
  };
  
  return event;
}

/**
 * 处理 agent_end - 生成输出
 */
async function handleAgentEnd(event) {
  console.log('[output-system] Generating output...');
  
  const context = event.context || {};
  const messages = context.messages || [];
  
  // 获取最后助手回复
  const reversed = [...messages].reverse();
  const lastAssistantMsg = reversed.find((m) => m.role === 'assistant');
  
  if (lastAssistantMsg) {
    // 获取内容
    let content = '';
    if (typeof lastAssistantMsg.content === 'string') {
      content = lastAssistantMsg.content;
    } else if (Array.isArray(lastAssistantMsg.content)) {
      content = lastAssistantMsg.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text || '')
        .join('');
    }
    
    // 格式化输出（附加情感状态）
    const formattedContent = formatOutput(content, context);
    
    // 更新消息
    lastAssistantMsg.content = formattedContent;
    
    console.log('[output-system] Output formatted with emotion state');
  }
  
  return event;
}

/**
 * 执行行动
 */
async function handleExecuteAction(event) {
  const action = event.action;
  const params = event.params || {};
  
  if (action) {
    const result = await runPythonCli([
      'action',
      action,
      JSON.stringify(params)
    ]);
    
    event.actionResult = result;
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[output-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'agent' || type === 'agent_start') {
      await handleAgentStart(event);
    }
    else if (type === 'lifecycle' || type === 'lifecycle:end' || type === 'agent_end') {
      await handleAgentEnd(event);
    }
    else if (type === 'command') {
      if (action === 'execute' || action === 'run') {
        await handleExecuteAction(event);
      }
      else if (action === 'output' || action === 'status') {
        const result = await runPythonCli(['status', '--json']);
        if (result.success) {
          event.response = result.output;
        }
      }
    }
  } catch (error) {
    console.error('[output-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'output-system',
  description: '输出执行系统，语言生成、行动执行、反馈收集、多模态输出',
  events: ['agent', 'lifecycle', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
