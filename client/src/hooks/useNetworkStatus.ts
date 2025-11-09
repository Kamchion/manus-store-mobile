import { useState, useEffect } from 'react';
import { networkManager } from '@/lib/capacitor/network';

/**
 * Hook para detectar estado de conectividad
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Obtener estado inicial
    networkManager.getStatus().then(status => {
      setIsOnline(status);
    });

    // Escuchar cambios
    const removeListener = networkManager.addListener((status) => {
      setIsOnline(status);
    });

    return () => {
      removeListener();
    };
  }, []);

  return { isOnline };
}
