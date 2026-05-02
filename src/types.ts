export interface Device {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'security' | 'lock' | 'power';
  status: 'on' | 'off' | 'locked' | 'unlocked' | 'active' | 'inactive';
  value?: number | string;
  location: string;
}

export interface SensorData {
  timestamp: number;
  cpuLoad: number;
  memoryUsage: number;
  networkTraffic: number;
  trafficSpeed?: number;
  energyConsumption: number;
  externalThreats: number;
}

export interface PredictionInsight {
  id: string;
  category: 'efficiency' | 'security' | 'maintenance' | 'optimization';
  title: string;
  description: string;
  probability: number;
  actionRequired: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'atlas';
  content: string;
  timestamp: Date;
}
