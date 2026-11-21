// Pont entre Electron i la web (window.xtEscriptori, el fa servir www/js/plataforma.js).
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('xtEscriptori', {
  info: () => ipcRenderer.invoke('info'),
  apps: () => ipcRenderer.invoke('apps'),
  desa: (o) => ipcRenderer.invoke('desa', o),
  aplica: (o) => ipcRenderer.invoke('aplica', o),
  descarregaAdb: () => ipcRenderer.invoke('descarrega-adb'),
  obreExtern: (url) => ipcRenderer.send('obre-extern', url),
  busca: (url) => ipcRenderer.invoke('busca', url),
});
