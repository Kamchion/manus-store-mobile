import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Database, 
  Image as ImageIcon, 
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Upload,
  HardDrive,
  Trash2,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncManager } from '@/lib/capacitor/sync-manager';
import { imageManager } from '@/lib/capacitor/filesystem';
import { databaseManager } from '@/lib/capacitor/database';
import { Capacitor } from '@capacitor/core';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

/**
 * Panel de sincronización para vendedores
 * Muestra estado detallado y permite sincronización manual
 */
export function VendedorSyncPanel() {
  const { isOnline } = useNetworkStatus();
  const { syncStatus, isLoading, error, triggerSync } = useSyncStatus();
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [storageInfo, setStorageInfo] = useState({
    imageCount: 0,
    imageSize: 0,
    dbReady: false
  });
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Obtener información de almacenamiento
  useEffect(() => {
    const fetchStorageInfo = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        const imageCount = await imageManager.getLocalImageCount();
        const imageSize = await imageManager.getLocalImageSize();
        const dbReady = databaseManager.isReady();

        setStorageInfo({
          imageCount,
          imageSize,
          dbReady
        });
      } catch (error) {
        console.error('Error fetching storage info:', error);
      }
    };

    fetchStorageInfo();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStorageInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Manejar sincronización completa
  const handleFullSync = async () => {
    try {
      setSyncProgress(0);
      setSyncMessage('Iniciando sincronización completa...');

      const result = await triggerSync(true);

      if (result.success) {
        setSyncProgress(100);
        setSyncMessage('Sincronización completada exitosamente');
        toast.success('Sincronización completada', {
          description: `${result.productsDownloaded} productos, ${result.imagesDownloaded} imágenes, ${result.ordersUploaded} pedidos sincronizados`
        });
      } else {
        toast.error('Error en sincronización', {
          description: result.errors.join(', ')
        });
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Error durante la sincronización'
      });
    } finally {
      setSyncProgress(0);
      setSyncMessage('');
    }
  };

  // Manejar sincronización incremental
  const handleIncrementalSync = async () => {
    try {
      setSyncMessage('Sincronizando cambios...');

      const result = await triggerSync(false);

      if (result.success) {
        const updates = result.productsDownloaded || 0;
        const uploaded = result.ordersUploaded || 0;
        
        if (updates > 0 || uploaded > 0) {
          toast.success('Sincronización completada', {
            description: `${updates} actualizaciones, ${uploaded} pedidos enviados`
          });
        } else {
          toast.success('Todo está actualizado');
        }
      } else {
        toast.error('Error en sincronización', {
          description: result.errors.join(', ')
        });
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Error durante la sincronización'
      });
    } finally {
      setSyncMessage('');
    }
  };

  // Manejar reset completo de base de datos
  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      setSyncMessage('Eliminando datos locales...');
      
      // Limpiar base de datos
      await databaseManager.clearAllData();
      
      // Limpiar cache de imágenes
      await imageManager.clearImageCache();
      
      toast.success('Datos eliminados', {
        description: 'Se han eliminado todos los datos locales'
      });
      
      // Esperar 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Realizar sincronización completa
      if (isOnline) {
        setSyncMessage('Descargando datos nuevamente...');
        const result = await triggerSync(true);
        
        if (result.success) {
          toast.success('Reset completado', {
            description: 'Los datos se han descargado nuevamente'
          });
        } else {
          toast.error('Error al descargar datos', {
            description: result.errors.join(', ')
          });
        }
      } else {
        toast.warning('Sin conexión', {
          description: 'Conecta a internet para descargar los datos'
        });
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Error durante el reset'
      });
    } finally {
      setIsResetting(false);
      setSyncMessage('');
      setShowResetDialog(false);
    }
  };

  // Si no es plataforma nativa, no mostrar
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="h-6 w-6" />
              Sincronización Offline
            </CardTitle>
            <CardDescription>
              Gestiona la sincronización de datos para trabajar sin conexión
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Estado de conectividad */}
            <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-2 px-4 py-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4" />
                  En línea
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  Sin conexión
                </>
              )}
            </Badge>

            {/* Menú de opciones avanzadas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Opciones Avanzadas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => setShowResetDialog(true)}
                  disabled={isResetting || syncStatus?.isSyncing}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Completo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alerta de modo offline */}
        {!isOnline && (
          <Alert variant="warning">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Modo sin conexión</AlertTitle>
            <AlertDescription>
              Estás trabajando offline. Los pedidos se guardarán localmente y se sincronizarán cuando vuelvas a estar en línea.
            </AlertDescription>
          </Alert>
        )}

        {/* Error de sincronización */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de sincronización</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Información de estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Última sincronización */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Última sincronización
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncStatus?.lastSyncTime ? (
                <div>
                  <p className="text-2xl font-bold">
                    {formatDistanceToNow(syncStatus.lastSyncTime, {
                      addSuffix: true,
                      locale: es
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {syncStatus.lastSyncTime.toLocaleString('es-ES')}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Nunca sincronizado</p>
              )}
            </CardContent>
          </Card>

          {/* Pedidos pendientes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Pedidos pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {syncStatus?.pendingOrders || 0}
                </p>
                {syncStatus?.pendingOrders && syncStatus.pendingOrders > 0 ? (
                  <Badge variant="warning" className="gap-1">
                    <Upload className="h-3 w-3" />
                    Por sincronizar
                  </Badge>
                ) : (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Sincronizado
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Almacenamiento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Almacenamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Imágenes:</span>
                  <span className="font-medium">{storageInfo.imageCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tamaño:</span>
                  <span className="font-medium">{formatFileSize(storageInfo.imageSize)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base de datos:</span>
                  {storageInfo.dbReady ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Lista
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No inicializada</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progreso de sincronización */}
        {(syncStatus?.isSyncing || isLoading) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{syncMessage || 'Sincronizando...'}</span>
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            {syncProgress > 0 && (
              <Progress value={syncProgress} className="h-2" />
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sincronización rápida */}
          <Button
            onClick={handleIncrementalSync}
            disabled={!isOnline || syncStatus?.isSyncing || isLoading}
            size="lg"
            className="w-full"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${(syncStatus?.isSyncing || isLoading) ? 'animate-spin' : ''}`} />
            Sincronización Rápida
          </Button>

          {/* Sincronización completa */}
          <Button
            onClick={handleFullSync}
            disabled={!isOnline || syncStatus?.isSyncing || isLoading}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Download className="h-5 w-5 mr-2" />
            Sincronización Completa
          </Button>
        </div>

        {/* Información adicional */}
        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
          <p className="font-medium">ℹ️ Información:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• <strong>Sincronización Rápida:</strong> Solo descarga cambios recientes y sube pedidos pendientes</li>
            <li>• <strong>Sincronización Completa:</strong> Descarga todo el catálogo, clientes e imágenes desde cero</li>
            <li>• La sincronización se ejecuta automáticamente cuando detecta conexión a internet</li>
            <li>• Puedes crear pedidos sin conexión, se sincronizarán automáticamente</li>
          </ul>
        </div>

        {/* Estado de sincronización automática */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Sincronización automática habilitada</span>
          </div>
          <Badge variant="default">Activa</Badge>
        </div>
      </CardContent>

      {/* Dialog de confirmación de reset */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              ¿Resetear toda la base de datos?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium text-foreground">
                Esta acción eliminará permanentemente:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Todos los productos descargados</li>
                <li>Todas las imágenes almacenadas</li>
                <li>Información de clientes</li>
                <li>Historial de sincronización</li>
              </ul>
              <p className="font-medium text-red-600">
                ⚠️ Los pedidos pendientes de sincronizar se perderán si no están sincronizados.
              </p>
              {syncStatus?.pendingOrders && syncStatus.pendingOrders > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tienes {syncStatus.pendingOrders} pedido(s) pendiente(s) de sincronizar.
                    Se recomienda sincronizar antes de hacer el reset.
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-sm">
                Después del reset, se descargarán todos los datos nuevamente desde el servidor.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDatabase}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reseteando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sí, resetear todo
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
