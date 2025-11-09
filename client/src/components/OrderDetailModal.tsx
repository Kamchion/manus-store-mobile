import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OrderDetailModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  if (!order) return null;
  
  // Función para agregar timestamp a la URL de la imagen para evitar caché
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "";
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${Date.now()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Pedido #{order.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-sm text-gray-600">Nombre:</span>
                <p className="font-medium">{order.user?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium">{order.user?.email || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Código Cliente:</span>
                <p className="font-medium font-mono">{order.userId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Teléfono:</span>
                <p className="font-medium">{order.user?.phone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Información del Agente */}
          {order.agent && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Información del Agente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-gray-600">Nombre:</span>
                  <p className="font-medium">{order.agent.name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Código Agente:</span>
                  <p className="font-medium font-mono">{order.agent.agentNumber || order.agent.username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información del Pedido */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Información del Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-sm text-gray-600">Fecha:</span>
                <p className="font-medium">{new Date(order.createdAt).toLocaleString('es-ES')}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Estado:</span>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total de Líneas:</span>
                <p className="font-medium">{order.items.length}</p>
              </div>
            </div>
          </div>

          {/* Productos del Pedido */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Productos</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Imagen</th>
                    <th className="text-left p-3 text-sm font-semibold">Producto</th>
                    <th className="text-center p-3 text-sm font-semibold">Cantidad</th>
                    <th className="text-right p-3 text-sm font-semibold">Precio Unit.</th>
                    <th className="text-right p-3 text-sm font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, index: number) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        {item.product?.imageUrl ? (
                          <img 
                            src={getImageUrl(item.product.imageUrl)} 
                            alt={item.product.name}
                            className="w-12 h-12 object-contain rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Sin img</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.product?.name || "Producto eliminado"}</p>
                          <p className="text-sm text-gray-600">SKU: {item.product?.sku || "N/A"}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center font-semibold">{item.quantity}</td>
                      <td className="p-3 text-right">${item.price?.toFixed(2) || "0.00"}</td>
                      <td className="p-3 text-right font-semibold">
                        ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td colSpan={4} className="p-3 text-right font-bold">Total:</td>
                    <td className="p-3 text-right font-bold text-lg text-blue-600">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notas adicionales si existen */}
          {order.notes && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Notas</h3>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

