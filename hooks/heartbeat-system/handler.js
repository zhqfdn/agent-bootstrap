/**
 * Heartbeat System Hook Handler
 * 
 * 集成 Python heartbeat-system 到 OpenClaw
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  heartbeatSystemPath: 'templates/heartbeat-system',
  mainScript: 'main.py',
};

/**
 * 运行 Python heartbeat-system CLI
 */
async function runPythonCli(args = []) {
  const workspaceDir = process.env.OPENCLAW_WORKSPACE || 
    path.join(os.homedir(), '.openclaw', 'workspace');
  const pythonScript = path.join(workspaceDir, CONFIG.heartbeatSystemPath, CONFIG.mainScript);
  
  return new Promise((resolve) => {
    fs.access(pythonScript).then(() => {
      const proc = spawn('python3', [pythonScript, ...args], {
        cwd: workspaceDir,
        env: { 
          ...process.env, 
          OPENCLAW_WORKSPACE: workspaceDir,
          PYTHONPATH: path.join(workspaceDir, CONFIG.heartbeatSystemPath)
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
      resolve({ success: false, error: 'Heartbeat system not found' });
    });
  });
}

/**
 * 处理 heartbeat / pulse 事件
 */
async function handleHeartbeat(event) {
  console.log('[heartbeat-system] Heartbeat pulse, running tasks...');
  
  const result = await runPythonCli(['run', '--once']);
  
  if (result.success) {
    console.log('[heartbeat-system] Tasks completed');
  } else {
    console.log('[heartbeat-system] Tasks failed:', result.error);
  }
  
  return event;
}

/**
 * 处理 status 命令
 */
async function handleStatus(event) {
  const result = await runPythonCli(['status', '--json']);
  
  if (result.success) {
    event.response = result.output;
  }
  
  return event;
}

/**
 * 主 handler
 */
async function handle(event) {
  const type = event.type || event.event || '';
  const action = event.action || '';
  
  console.log(`[heartbeat-system] Event: ${type}/${action}`);
  
  try {
    if (type === 'heartbeat' || type === 'pulse') {
      await handleHeartbeat(event);
    }
    else if (type === 'command') {
      if (action === 'heartbeat' || action === 'status') {
        await handleStatus(event);
      }
    }
  } catch (error) {
    console.error('[heartbeat-system] Handler error:', error.message);
  }
  
  return event;
}

module.exports = handle;
module.exports.handle = handle;
module.exports.metadata = {
  name: 'heartbeat-system',
  description: '心跳系统，定时执行情感衰减、状态保存、垃圾清理',
  events: ['heartbeat', 'pulse', 'command'],
  version: '1.0.0',
};

module.exports.default = handle;
