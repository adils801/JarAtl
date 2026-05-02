const { contextBridge } = require('electron');
const si = require('systeminformation');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemStats: async () => {
    try {
      const cpu = await si.currentLoad();
      const mem = await si.mem();
      const network = await si.networkStats();
      const fsSize = await si.fsSize();
      
      return {
        cpuUsage: cpu.currentLoad,
        memoryUsage: (mem.active / mem.total) * 100,
        networkTraffic: network[0]?.rx_sec / 1024 / 1024 || 0, // Mbps
        diskUsage: fsSize[0]?.use || 0,
        platform: process.platform,
        uptime: await si.time().uptime
      };
    } catch (err) {
      console.error("Error fetching system stats:", err);
      return null;
    }
  }
});
