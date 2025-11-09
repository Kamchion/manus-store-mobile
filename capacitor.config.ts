import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.manusstore.b2b',
  appName: 'Manus Store',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // Permitir cleartext solo para desarrollo local
    cleartext: true
  },
  android: {
    // Configuración específica de Android
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    // Configuración de plugins
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#2563eb"
    }
  }
};

export default config;
