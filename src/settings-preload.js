const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settings', {
  get: () => ipcRenderer.invoke('settings:get'),
  save: (cfg) => ipcRenderer.invoke('settings:save', cfg),
  onConfig: (cb) => ipcRenderer.on('config', (_e, cfg) => cb(cfg)),
  onThemes: (cb) => ipcRenderer.on('themes', (_e, list) => cb(list)),
  getThemes: () => ipcRenderer.invoke('themes:get'),
  addTheme: (t) => ipcRenderer.invoke('themes:add', t),
  deleteTheme: (name) => ipcRenderer.invoke('themes:delete', name),
  testSound: () => ipcRenderer.send('settings:testSound'),
  close: () => ipcRenderer.send('settings:close'),
});
