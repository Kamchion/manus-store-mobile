import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, AlertCircle, Package } from "lucide-react";
import { useSystemConfig } from "@/_core/hooks/useSystemConfig";

export default function Orders() {
  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  const { formatPrice } = useSystemConfig();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Catálogo
          </Link>
        </Button>

        <div className="text-center space-y-6 py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400" />
          <div>
            <h2 className="text-2xl font-semibold">No tienes pedidos aún</h2>
            <p className="text-gray-600 mt-2">Comienza a comprar para ver tus pedidos aquí</p>
          </div>
          <Button asChild size="lg">
            <Link href="/products">Explorar Productos</Link>
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
        <Link href="/products">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Catálogo
        </Link>
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <p className="text-gray-600 mt-2">{orders.length} pedido(s) total(es)</p>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {order.createdAt && new Date(order.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          order.status || "shipped"
                        )}`}
                      >
                        {getStatusLabel(order.status || "shipped")}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Subtotal</p>
                        <p className="font-semibold">{formatPrice(order.subtotal as string)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Impuesto</p>
                        <p className="font-semibold">{formatPrice(order.tax as string)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-semibold text-blue-600 text-lg">
                          {formatPrice(order.total as string)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button asChild variant="outline">
                    <Link href={`/orders/${order.id}`}>
                      Ver Detalles
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

