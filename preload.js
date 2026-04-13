const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hermesAPI', {
  checkHermes: () => ipcRenderer.invoke('check-hermes'),
  startChat: () => ipcRenderer.invoke('start-chat'),
  sendMessage: (msg) => ipcRenderer.invoke('send-message', msg),
  stopChat: () => ipcRenderer.invoke('stop-chat'),
  onChatOutput: (callback) => {
    ipcRenderer.on('chat-output', (event, data) => callback(data));
  },
  onChatError: (callback) => {
    ipcRenderer.on('chat-error', (event, error) => callback(error));
  }
});
