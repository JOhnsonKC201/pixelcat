const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cat', {
  onCursor: (cb) => ipcRenderer.on('cursor', (_e, data) => cb(data)),
  onKey: (cb) => ipcRenderer.on('keydown', () => cb()),
  onAgent: (cb) => ipcRenderer.on('agent', (_e, s) => cb(s)),
  onScroll: (cb) => ipcRenderer.on('scroll', () => cb()),
  onConfig: (cb) => ipcRenderer.on('config', (_e, cfg) => cb(cfg)),
  onThemes: (cb) => ipcRenderer.on('themes', (_e, list) => cb(list)),
  onRemind: (cb) => ipcRenderer.on('remind', (_e, data) => cb(data)),
  onBreak: (cb) => ipcRenderer.on('break', () => cb()),
  setHot: (o) => ipcRenderer.send('hot', o),
  openSettings: () => ipcRenderer.send('settings:open'),
  setPattern: (i) => ipcRenderer.send('settings:save-pattern', i),
  quit: () => ipcRenderer.send('quit'),
});
