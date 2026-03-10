import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.kadromierz.hvln',
  appName: 'Dolapp',
  webDir: 'out',
  server: {
    url: 'https://app.dolapp.pl',
    cleartext: true
  }
};

export default config;
