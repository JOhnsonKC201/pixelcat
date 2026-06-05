const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cat', {
  onCursor: (cb) => ipcRenderer.on('cursor', (_e, data) => cb(data)),
  onKey: (cb) => ipcRenderer.on('keydown', () => cb()),
  setHot: (o) => ipcRenderer.send('hot', o),
  quit: () => ipcRenderer.send('quit'),
});
