const { contextBridge, ipcRenderer } = require('electron');

// Each onXxx() registration REPLACES any previous handler for that channel, so
// listeners never stack across overlay reloads (e.g. the GPU-crash auto-recovery
// in main.js calls win.reload(), which re-runs the renderer's registrations).
const sub = (channel, transform) => (cb) => {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, (_e, ...args) => cb(transform ? transform(...args) : undefined));
};

contextBridge.exposeInMainWorld('cat', {
  onCursor: sub('cursor', (d) => d),
  onKey: sub('keydown'),
  onAgent: sub('agent', (s) => s),
  onScroll: sub('scroll'),
  onConfig: sub('config', (cfg) => cfg),
  onThemes: sub('themes', (list) => list),
  onMood: sub('mood', (c) => c),
  onSetArea: sub('setarea:start'),
  onRemind: sub('remind', (d) => d),
  onBreak: sub('break'),
  onPomo: sub('pomo', (d) => d),
  setHot: (o) => ipcRenderer.send('hot', o),
  openSettings: () => ipcRenderer.send('settings:open'),
  setPattern: (i) => ipcRenderer.send('settings:save-pattern', i),
  quit: () => ipcRenderer.send('quit'),
  sheetImage: (dataUrl) => ipcRenderer.send('sheet:image', dataUrl),
  setAreaDone: (area) => ipcRenderer.send('setarea:done', area),
});
