const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settings', {
  get: () => ipcRenderer.invoke('settings:get'),
  save: (cfg) => ipcRenderer.invoke('settings:save', cfg),
  onConfig: (cb) => ipcRenderer.on('config', (_e, cfg) => cb(cfg)),
  testSound: () => ipcRenderer.send('settings:testSound'),
  close: () => ipcRenderer.send('settings:close'),
});
