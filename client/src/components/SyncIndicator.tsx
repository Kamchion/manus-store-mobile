import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente que muestra el estado de sincronización y conectividad
 */
export function SyncIndicator() {
  const { isOnline } = useNetworkStatus();
  const { syncStatus, isLoading, triggerSync } = useSyncStatus();

  if (!syncStatus) return null;

  const handleSync = async () => {
    try {
      await triggerSync(false);
    } catch (error) {
      console.error('Error during manual sync:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background border rounded-lg">
      {/* Indicador de conectividad */}
      <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1">
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            <span className="text-xs">En línea</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span className="text-xs">Sin conexión</span>
          </>
        )}
      </Badge>

      {/* Indicador de pedidos pendientes */}
      {syncStatus.pendingOrders > 0 && (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          <span className="text-xs">{syncStatus.pendingOrders} pendientes</span>
        </Badge>
      )}

      {/* Indicador de sincronización en progreso */}
      {syncStatus.isSyncing && (
        <Badge variant="default" className="gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span className="text-xs">Sincronizando...</span>
        </Badge>
      )}

      {/* Última sincronización */}
      {syncStatus.lastSyncTime && !syncStatus.isSyncing && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(syncStatus.lastSyncTime, {
              addSuffix: true,
              locale: es
            })}
          </span>
        </div>
      )}

      {/* Botón de sincronización manual */}
      {isOnline && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSync}
          disabled={syncStatus.isSyncing || isLoading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${(syncStatus.isSyncing || isLoading) ? 'animate-spin' : ''}`} />
        </Button>
      )}

      {/* Indicador de éxito */}
      {!syncStatus.isSyncing && syncStatus.pendingOrders === 0 && syncStatus.lastSyncTime && (
        <CheckCircle className="w-4 h-4 text-green-500" />
      )}
    </div>
  );
}
