const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('saeipari', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (payload) => ipcRenderer.invoke('data:save', payload),
  backup: () => ipcRenderer.invoke('data:backup'),
  exportFile: (args) => ipcRenderer.invoke('data:export', args),
  print: () => ipcRenderer.invoke('app:print'),
  paths: () => ipcRenderer.invoke('app:paths'),
  onShortcut: (cb) => ipcRenderer.on('shortcut', (_e, key) => cb(key))
});
