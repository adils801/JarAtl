const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemStats: () => ({
    cpuUsage: os.loadavg()[0] * 100 / os.cpus().length,
    memoryUsage: (1 - os.freemem() / os.totalmem()) * 100,
    platform: os.platform(),
    uptime: os.uptime()
  })
});
