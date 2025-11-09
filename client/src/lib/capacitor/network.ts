import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

/**
 * Network Manager para detectar estado de conectividad
 */
class NetworkManager {
  private listeners: Array<(isOnline: boolean) => void> = [];
  private currentStatus: boolean = true;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializar el monitoreo de red
   */
  private async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // En web, usar navigator.onLine
      this.currentStatus = navigator.onLine;
      window.addEventListener('online', () => this.handleStatusChange(true));
      window.addEventListener('offline', () => this.handleStatusChange(false));
      return;
    }

    // En plataformas nativas, usar plugin de Capacitor
    const status = await Network.getStatus();
    this.currentStatus = status.connected;

    // Escuchar cambios de estado
    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      this.handleStatusChange(status.connected);
    });
  }

  /**
   * Manejar cambio de estado de red
   */
  private handleStatusChange(isOnline: boolean): void {
    if (this.currentStatus !== isOnline) {
      this.currentStatus = isOnline;
      console.log(`Network status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      // Notificar a todos los listeners
      this.listeners.forEach(listener => listener(isOnline));
    }
  }

  /**
   * Obtener estado actual de la red
   */
  async getStatus(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return navigator.onLine;
    }

    const status = await Network.getStatus();
    return status.connected;
  }

  /**
   * Verificar si hay conexión a internet
   */
  isOnline(): boolean {
    return this.currentStatus;
  }

  /**
   * Agregar listener para cambios de estado
   */
  addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);

    // Retornar función para remover el listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Remover todos los listeners
   */
  removeAllListeners(): void {
    this.listeners = [];
  }
}

// Exportar instancia singleton
export const networkManager = new NetworkManager();
