import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b41bf882e17a40f1b0a0256bb321e561',
  appName: 'trail-blaze-track',
  webDir: 'dist',
  server: {
    url: 'https://b41bf882-e17a-40f1-b0a0-256bb321e561.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
