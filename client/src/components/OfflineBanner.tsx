import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

/**
 * Banner que se muestra cuando no hay conexión a internet
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>Modo sin conexión</AlertTitle>
      <AlertDescription>
        Estás trabajando sin conexión a internet. Los pedidos se guardarán localmente y se sincronizarán automáticamente cuando vuelvas a estar en línea.
      </AlertDescription>
    </Alert>
  );
}
