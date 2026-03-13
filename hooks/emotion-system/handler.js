/**
 * Emotion System Hook Handler
 * 
 * 集成 Python emotion-system 到 OpenClaw
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  emotionSystemPath: 'templates/emotion-system',
  mainScript: 'main.py',
};

/**
 * 运行 Python emotion-system CLI
 */
async function runPythonCli(args = []) {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(os.homedir(), '.openclaw', 'workspace');
  const pythonScript = path.join(workspaceDir, CONFIG.emotionSystemPath, CONFIG.mainScript);
  
  return new Promise((resolve) => {
    fs.access(pythonScript).then(() => {
      const proc = spawn('python3', [pythonScript, ...args], {
        cwd: workspaceDir,
        env: { 
          ...process.env, 
          OPENCLAW_WORKSPACE: workspaceDir,
          PYTHONPATH: path.join(workspaceDir, CONFIG.emotionSystemPath)
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
      resolve({ success: false, error: 'Emotion system not found' });
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
 * 格式化情感状态展示 - 简洁版（手机端一行）
 */
function formatEmotionCompact(state) {
  if (!state) return '';
  
  const moodEmoji = {
    curious: '🧐', happy: '😊', calm: '😌', focused: '🎯',
    tired: '😴', anxious: '😰', excited: '🤩', thoughtful: '🤔',
    neutral: '😐', sad: '😢', grateful: '🥰',
  };
  
  const emoji = moodEmoji[state.mood] || '😐';
  const e = Math.round(state.energy * 100);
  const c = Math.round(state.connection * 100);
  const s = Math.round(state.stress * 100);
  
  return `${emoji} Lv.${state.level} ${state.mood} | ⚡${e}% | 💕${c}% | 😰${s}%`;
}

/**
 * 处理 session_start - 加载情感状态
 */
async function handleSessionStart(event) {
  console.log('[emotion-system] Session start, loading emotion state...');
  
  const result = await runPythonCli(['state', '--json']);
  
  if (result.success && result.output) {
    try {
      const state = JSON.parse(result.output);
      event.context = event.context || {};
      event.context.emotionState = state;
      console.log('[emotion-system] Emotion state loaded:', state.mood);
    } catch (e) {
      console.log('[emotion-system] Parse state error:', e.message);
    }
  } else {
    console.log('[emotion-system] Could not load state:', result.error);
  }
  
  return event;
}

/**
 * 处理 message:received - 分析用户消息
 */
async function handleMessageReceived(event) {
  console.log('[emotion-system] Analyzing message...');
  
  const context = event.context || {};
  const messages = context.messages || [];
  
  if (messages.length === 0) return event;
  
  const reversed = [...messages].reverse();
  const lastUserMsg = reversed.find((m) => m.role === 'user');
  
  if (!lastUserMsg) return event;
  
  const userText = extractMessageText(lastUserMsg);
  
  if (!userText || userText.startsWith('/')) return event;
  
  const result = await runPythonCli(['analyze', userText]);
  
  if (result.success) {
    console.log('[emotion-system] Message analyzed');
  }
  
  return event;
}

/**
 * 处理 agent_end - 互动结束，更新情感
 */
async function handleAgentEnd(event) {
  console.log('[emotion-system] Agent end, updating emotion...');
  
  await runPythonCli(['boost']);
  await runPythonCli(['success']);
  
  console.log('[emotion-system] Emotion updated');
  
  return event;
}

/**
 * 处理 heartbeat - 自然衰减
 */
async function handleHeartbeat(event) {
  console.log('[emotion-system] Heartbeat, applying decay...');
  await runPythonCli(['decay']);
  return event;
}

/**
 * 获取当前情感状态
 */
async function getEmotionState() {
  const result = await runPythonCli(['state', '--json']);
  if (result.success) {
    try {
      return JSON.parse(result.output);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[emotion-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'session' || type === 'session:start') {
      if (action === 'start' || action === '') {
        await handleSessionStart(event);
      }
    }
    else if (type === 'message' || type === 'message:received') {
      await handleMessageReceived(event);
    }
    else if (type === 'lifecycle' || type === 'lifecycle:end') {
      if (action === 'end' || action === '') {
        await handleAgentEnd(event);
      }
    }
    else if (type === 'heartbeat' || type === 'pulse') {
      await handleHeartbeat(event);
    }
    else if (type === 'command') {
      if (action === 'emotion' || action === '状态' || action === 'state') {
        const state = await getEmotionState();
        // 简洁版手机端显示
        event.response = formatEmotionCompact(state);
      }
    }
  } catch (error) {
    console.error('[emotion-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.getEmotionState = getEmotionState;
module.exports.formatEmotionCompact = formatEmotionCompact;
module.exports.metadata = {
  name: 'emotion-system',
  description: '集成情感系统，管理 Agent 心情、能量、连接感和压力',
  events: ['session', 'message', 'lifecycle', 'heartbeat', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
