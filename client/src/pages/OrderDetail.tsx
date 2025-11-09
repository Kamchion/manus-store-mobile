import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useRoute } from "wouter";
import { ArrowLeft, AlertCircle, Package } from "lucide-react";
import { useSystemConfig } from "@/_core/hooks/useSystemConfig";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const orderId = params?.id || "";
  const { config, formatPrice } = useSystemConfig();

  const { data: order, isLoading } = trpc.orders.getById.useQuery(
    { id: orderId },
    { enabled: !!orderId }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="text-2xl font-semibold">Pedido no encontrado</h2>
          <Button asChild variant="outline">
            <Link href="/orders">Volver a Mis Pedidos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-50 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      shipped: "Enviado",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/orders">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mis Pedidos
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Order Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{order.orderNumber}</CardTitle>
                <CardDescription>
                  {order.createdAt &&
                    new Date(order.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </CardDescription>
              </div>
              <div
                className={`px-4 py-2 rounded-lg text-sm font-medium border w-fit ${getStatusColor(
                  order.status || "shipped"
                )}`}
              >
                {getStatusLabel(order.status || "shipped")}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Order Items */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Productos</h2>

          {order.items && order.items.length > 0 ? (
            <div className="space-y-2">
              {order.items.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="py-1 px-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <h3 className="font-semibold text-sm">{item.productName}</h3>
                        <p className="text-xs text-gray-500">
                          SKU: {item.productId}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs ml-auto">
                        <div className="text-right">
                          <p className="text-gray-500">Precio</p>
                          <p className="font-semibold">
                            {formatPrice(item.pricePerUnit as string)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Cant.</p>
                          <p className="font-semibold">{item.quantity}</p>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <p className="text-gray-500">Subtotal</p>
                          <p className="font-semibold text-blue-600">
                            {formatPrice(item.subtotal as string)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No hay productos en este pedido</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 border-b border-blue-200 pb-4">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold">
                  {formatPrice(order.subtotal as string)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Impuesto ({config.taxRate}%):</span>
                <span className="font-semibold">
                  {formatPrice(order.tax as string)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatPrice(order.total as string)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button asChild variant="outline" className="flex-1 md:flex-none">
            <Link href="/orders">Volver a Mis Pedidos</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 md:flex-none">
            <Link href="/products">Seguir Comprando</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

