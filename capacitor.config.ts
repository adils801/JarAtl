import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stark.jarvis',
  appName: 'JARVIS System',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
