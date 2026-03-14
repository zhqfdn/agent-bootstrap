/**
 * Emotion System Hook Handler - TypeScript 版本
 * 
 * 直接调用 TypeScript 编译后的 emotion 模块
 */

const path = require('path');
const os = require('os');

// 获取插件目录（而非 workspace/templates）
const pluginDir = __dirname;

// 配置 - 指向 dist/systems（相对于插件根目录）
const CONFIG = {
  emotionSystemPath: path.join(pluginDir, '..', '..', 'dist', 'systems'),
};

/**
 * 加载 TypeScript 编译后的 EmotionSystem
 */
let EmotionSystem = null;

async function getEmotionSystem() {
  if (!EmotionSystem) {
    try {
      const module = await import(path.join(CONFIG.emotionSystemPath, 'emotion.js'));
      EmotionSystem = module.EmotionSystem || module.default;
    } catch (e) {
      console.error('[emotion-system] Failed to load emotion module:', e.message);
      return null;
    }
  }
  return EmotionSystem;
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
  const e = Math.round((state.energy || 0) * 100);
  const c = Math.round((state.connection || 0) * 100);
  const s = Math.round((state.stress || 0) * 100);
  const level = state.level || 1;
  
  return `${emoji} Lv.${level} ${state.mood || 'neutral'} | ⚡${e}% | 💕${c}% | 😰${s}%`;
}

/**
 * 处理 session_start - 加载情感状态
 */
async function handleSessionStart(event) {
  console.log('[emotion-system] Session start, loading emotion state...');
  
  try {
    const EmotionClass = await getEmotionSystem();
    if (EmotionClass) {
      const emotionSystem = new EmotionClass();
      const state = emotionSystem.getState();
      
      event.context = event.context || {};
      event.context.emotionState = state;
      console.log('[emotion-system] Emotion state loaded:', state.mood);
    }
  } catch (e) {
    console.log('[emotion-system] Could not load state:', e.message);
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
  
  try {
    const EmotionClass = await getEmotionSystem();
    if (EmotionClass) {
      const emotionSystem = new EmotionClass();
      emotionSystem.processInput(userText);
      console.log('[emotion-system] Message analyzed');
    }
  } catch (e) {
    console.log('[emotion-system] Analyze error:', e.message);
  }
  
  return event;
}

/**
 * 处理 agent_end - 互动结束，更新情感
 */
async function handleAgentEnd(event) {
  console.log('[emotion-system] Agent end, updating emotion...');
  
  try {
    const EmotionClass = await getEmotionSystem();
    if (EmotionClass) {
      const emotionSystem = new EmotionClass();
      emotionSystem.boost();
      emotionSystem.recordSuccess();
      console.log('[emotion-system] Emotion updated');
    }
  } catch (e) {
    console.log('[emotion-system] Update error:', e.message);
  }
  
  return event;
}

/**
 * 处理 heartbeat - 自然衰减
 */
async function handleHeartbeat(event) {
  console.log('[emotion-system] Heartbeat, applying decay...');
  
  try {
    const EmotionClass = await getEmotionSystem();
    if (EmotionClass) {
      const emotionSystem = new EmotionClass();
      emotionSystem.decay();
      console.log('[emotion-system] Decay applied');
    }
  } catch (e) {
    console.log('[emotion-system] Decay error:', e.message);
  }
  
  return event;
}

/**
 * 获取当前情感状态
 */
async function getEmotionState() {
  try {
    const EmotionClass = await getEmotionSystem();
    if (EmotionClass) {
      const emotionSystem = new EmotionClass();
      return emotionSystem.getState();
    }
  } catch (e) {
    return null;
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
  description: 'Emotion System: manages agent mood, energy, connection and stress',
  events: ['session', 'message', 'lifecycle', 'heartbeat', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
