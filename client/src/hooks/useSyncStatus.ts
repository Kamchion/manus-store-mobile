import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '@/lib/capacitor/sync-manager';
import type { SyncStatus } from '@/lib/data-layer/types';

/**
 * Hook para obtener y gestionar el estado de sincronización
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener estado inicial
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await syncManager.getSyncStatus();
        setSyncStatus(status);
      } catch (err) {
        console.error('Error fetching sync status:', err);
      }
    };

    fetchStatus();

    // Actualizar cada 10 segundos
    const interval = setInterval(fetchStatus, 10000);

    // Escuchar cambios de estado
    const removeListener = syncManager.addListener((status) => {
      setSyncStatus(status);
    });

    return () => {
      clearInterval(interval);
      removeListener();
    };
  }, []);

  // Función para ejecutar sincronización manual
  const triggerSync = useCallback(async (fullSync = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = fullSync
        ? await syncManager.performFullSync()
        : await syncManager.performIncrementalSync();

      if (!result.success) {
        setError(result.errors.join(', '));
      }

      // Actualizar estado
      const status = await syncManager.getSyncStatus();
      setSyncStatus(status);

      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Error during sync';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    syncStatus,
    isLoading,
    error,
    triggerSync
  };
}
