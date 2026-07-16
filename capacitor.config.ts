import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wanderlust.travel',
  appName: 'Wanderlust AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://ais-pre-mdbxylovblelb4ewfjgsjr-578835611426.asia-east1.run.app',
    cleartext: true
  }
};

export default config;
