const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 检查 Hermes 是否安装
ipcMain.handle('check-hermes', async () => {
  return new Promise((resolve) => {
    const proc = spawn('which', ['hermes']);
    proc.on('close', (code) => resolve({ installed: code === 0 }));
    proc.on('error', () => resolve({ installed: false }));
  });
});

// 对话进程
let hermesProcess = null;

ipcMain.handle('start-chat', async (event) => {
  try {
    hermesProcess = spawn('hermes', [], { 
      shell: true,
      env: { ...process.env, TERM: 'xterm-256color' }
    });
    
    hermesProcess.stdout.on('data', (data) => {
      event.sender.send('chat-output', data.toString());
    });
    
    hermesProcess.stderr.on('data', (data) => {
      event.sender.send('chat-output', data.toString());
    });
    
    hermesProcess.on('error', (err) => {
      event.sender.send('chat-error', err.message);
    });
    
    return { started: true };
  } catch (err) {
    return { started: false, error: err.message };
  }
});

ipcMain.handle('send-message', async (event, message) => {
  if (hermesProcess && hermesProcess.stdin.writable) {
    hermesProcess.stdin.write(message + '\n');
    return { sent: true };
  }
  return { sent: false, error: 'Hermes not running' };
});

ipcMain.handle('stop-chat', async () => {
  if (hermesProcess) {
    hermesProcess.kill();
    hermesProcess = null;
    return { stopped: true };
  }
  return { stopped: false };
});
