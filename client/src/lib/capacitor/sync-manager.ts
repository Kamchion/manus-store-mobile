import { networkManager } from './network';
import { imageManager } from './filesystem';
import { offlineDataSource } from '../data-layer/offline-data-source';
import { trpc } from '@/lib/trpc';
import type { SyncStatus, SyncResult } from '../data-layer/types';

/**
 * Sync Manager - Orquesta la sincronización bidireccional entre local y servidor
 */
class SyncManager {
  private isSyncing = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];
  private autoSyncEnabled = true;

  constructor() {
    this.initializeAutoSync();
  }

  /**
   * Inicializar sincronización automática cuando hay conexión
   */
  private initializeAutoSync(): void {
    // Escuchar cambios de conectividad
    networkManager.addListener(async (isOnline) => {
      if (isOnline && this.autoSyncEnabled && !this.isSyncing) {
        console.log('Connection detected, starting auto-sync...');
        await this.performIncrementalSync();
      }
    });
  }

  /**
   * Realizar sincronización completa (primera vez)
   */
  async performFullSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!networkManager.isOnline()) {
      throw new Error('No internet connection');
    }

    this.isSyncing = true;
    this.notifyListeners();

    const result: SyncResult = {
      success: false,
      productsDownloaded: 0,
      clientsDownloaded: 0,
      imagesDownloaded: 0,
      ordersUploaded: 0,
      errors: []
    };

    try {
      console.log('Starting full sync...');

      // 1. Subir pedidos pendientes primero
      try {
        result.ordersUploaded = await this.uploadPendingOrders();
        console.log(`Uploaded ${result.ordersUploaded} pending orders`);
      } catch (error) {
        result.errors.push(`Error uploading orders: ${error.message}`);
      }

      // 2. Descargar sincronización inicial del servidor
      try {
        const syncData = await trpc.sync.initialSync.query({ includeImages: true });

        // 3. Guardar productos
        if (syncData.products && syncData.products.length > 0) {
          await offlineDataSource.saveProducts(syncData.products);
          result.productsDownloaded = syncData.products.length;
          console.log(`Downloaded ${result.productsDownloaded} products`);
        }

        // 4. Guardar clientes (si es vendedor)
        if (syncData.clients && syncData.clients.length > 0) {
          await offlineDataSource.saveClients(syncData.clients);
          result.clientsDownloaded = syncData.clients.length;
          console.log(`Downloaded ${result.clientsDownloaded} clients`);
        }

        // 5. Guardar precios
        if (syncData.pricing && syncData.pricing.length > 0) {
          await offlineDataSource.savePricing(syncData.pricing);
          console.log(`Downloaded ${syncData.pricing.length} pricing records`);
        }

        // 6. Guardar promociones
        if (syncData.promotions && syncData.promotions.length > 0) {
          await offlineDataSource.savePromotions(syncData.promotions);
          console.log(`Downloaded ${syncData.promotions.length} promotions`);
        }

        // 7. Descargar imágenes
        if (syncData.products && syncData.products.length > 0) {
          const imageResult = await imageManager.downloadImages(syncData.products);
          result.imagesDownloaded = imageResult.successCount;
          console.log(`Downloaded ${result.imagesDownloaded} images`);
          
          if (imageResult.failedCount > 0) {
            result.errors.push(`Failed to download ${imageResult.failedCount} images`);
          }
        }

        // 8. Actualizar metadata de sincronización
        await offlineDataSource.updateSyncMetadata('lastFullSync', syncData.timestamp);
        await offlineDataSource.updateSyncMetadata('lastIncrementalSync', syncData.timestamp);

        result.success = true;
        console.log('Full sync completed successfully');
      } catch (error) {
        result.errors.push(`Error downloading data: ${error.message}`);
        console.error('Full sync error:', error);
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return result;
  }

  /**
   * Realizar sincronización incremental (solo cambios)
   */
  async performIncrementalSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return {
        success: false,
        errors: ['Sync already in progress']
      };
    }

    if (!networkManager.isOnline()) {
      return {
        success: false,
        errors: ['No internet connection']
      };
    }

    this.isSyncing = true;
    this.notifyListeners();

    const result: SyncResult = {
      success: false,
      productsDownloaded: 0,
      ordersUploaded: 0,
      errors: []
    };

    try {
      console.log('Starting incremental sync...');

      // 1. Subir cambios pendientes
      try {
        result.ordersUploaded = await this.uploadPendingOrders();
        if (result.ordersUploaded > 0) {
          console.log(`Uploaded ${result.ordersUploaded} pending orders`);
        }
      } catch (error) {
        result.errors.push(`Error uploading orders: ${error.message}`);
      }

      // 2. Obtener última fecha de sincronización
      const lastSync = await offlineDataSource.getSyncMetadata('lastIncrementalSync');

      // 3. Descargar solo cambios desde última sincronización
      try {
        const updates = await trpc.sync.getUpdates.query({
          lastSyncTimestamp: lastSync || new Date(0).toISOString()
        });

        // 4. Aplicar actualizaciones de productos
        if (updates.products && updates.products.length > 0) {
          await offlineDataSource.updateProducts(updates.products);
          result.productsDownloaded = updates.products.length;
          console.log(`Updated ${result.productsDownloaded} products`);

          // Descargar nuevas imágenes si hay productos nuevos
          const newProducts = updates.products.filter((p: any) => p.isNew);
          if (newProducts.length > 0) {
            await imageManager.downloadImages(newProducts);
          }
        }

        // 5. Aplicar actualizaciones de precios
        if (updates.pricing && updates.pricing.length > 0) {
          await offlineDataSource.updatePricing(updates.pricing);
          console.log(`Updated ${updates.pricing.length} pricing records`);
        }

        // 6. Aplicar actualizaciones de promociones
        if (updates.promotions && updates.promotions.length > 0) {
          await offlineDataSource.savePromotions(updates.promotions);
          console.log(`Updated ${updates.promotions.length} promotions`);
        }

        // 7. Actualizar metadata
        await offlineDataSource.updateSyncMetadata('lastIncrementalSync', updates.timestamp);

        result.success = true;
        console.log('Incremental sync completed successfully');
      } catch (error) {
        result.errors.push(`Error downloading updates: ${error.message}`);
        console.error('Incremental sync error:', error);
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return result;
  }

  /**
   * Subir pedidos pendientes al servidor
   */
  private async uploadPendingOrders(): Promise<number> {
    const pendingOrders = await offlineDataSource.getPendingOrders();

    if (pendingOrders.length === 0) {
      return 0;
    }

    console.log(`Found ${pendingOrders.length} pending orders to upload`);

    // Preparar datos para subir
    const ordersToUpload = await Promise.all(
      pendingOrders.map(async (order) => {
        const fullOrder = await offlineDataSource.getOrder(order.id);
        if (!fullOrder) return null;

        return {
          localId: order.localId!,
          orderData: {
            clientId: order.clientId,
            items: fullOrder.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              customText: item.customText,
              customSelect: item.customSelect
            })),
            notes: order.notes,
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total
          }
        };
      })
    );

    const validOrders = ordersToUpload.filter(o => o !== null);

    if (validOrders.length === 0) {
      return 0;
    }

    try {
      // Subir al servidor
      const results = await trpc.sync.uploadOrders.mutate(validOrders);

      let uploadedCount = 0;

      // Procesar resultados
      for (const result of results) {
        if (result.success) {
          // Actualizar ID local con ID del servidor
          await offlineDataSource.updateOrderId(result.localId, result.serverId);

          // Marcar como sincronizado
          await offlineDataSource.markOrderAsSynced(result.localId);

          // Remover de cola de sincronización
          await offlineDataSource.removeFromSyncQueue('order', result.localId);

          uploadedCount++;
        } else {
          // Registrar error
          await offlineDataSource.updateSyncQueueError('order', result.localId, result.error || 'Unknown error');
        }
      }

      return uploadedCount;
    } catch (error) {
      console.error('Error uploading orders:', error);
      throw error;
    }
  }

  /**
   * Obtener estado actual de sincronización
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingOrders = await offlineDataSource.getPendingOrdersCount();
    const lastSyncStr = await offlineDataSource.getSyncMetadata('lastIncrementalSync');
    const lastSyncTime = lastSyncStr ? new Date(lastSyncStr) : null;

    return {
      isOnline: networkManager.isOnline(),
      lastSyncTime,
      pendingOrders,
      isSyncing: this.isSyncing
    };
  }

  /**
   * Obtener última fecha de sincronización
   */
  async getLastSyncTime(): Promise<Date | null> {
    const lastSync = await offlineDataSource.getSyncMetadata('lastIncrementalSync');
    return lastSync ? new Date(lastSync) : null;
  }

  /**
   * Obtener conteo de cambios pendientes
   */
  async getPendingChangesCount(): Promise<number> {
    return await offlineDataSource.getPendingOrdersCount();
  }

  /**
   * Habilitar/deshabilitar sincronización automática
   */
  setAutoSyncEnabled(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  /**
   * Verificar si la sincronización automática está habilitada
   */
  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  /**
   * Agregar listener para cambios de estado
   */
  addListener(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);

    // Retornar función para remover el listener
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== callback);
    };
  }

  /**
   * Notificar a todos los listeners sobre cambio de estado
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(listener => listener(status));
  }

  /**
   * Limpiar todos los datos offline (útil para logout o reset)
   */
  async clearOfflineData(): Promise<void> {
    await offlineDataSource.clearCart();
    await imageManager.clearImageCache();
    // No limpiar productos/clientes para permitir uso offline después de logout
  }
}

// Exportar instancia singleton
export const syncManager = new SyncManager();
