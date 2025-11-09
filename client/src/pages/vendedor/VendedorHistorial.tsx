import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Calendar, Clock, User, DollarSign, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "wouter";

/**
 * Sección de Historial para vendedores
 * Muestra pedidos del mes actual con fecha, hora, cliente, total y estado
 */
export default function VendedorHistorial() {
  const { data: orders, isLoading } = trpc.orders.getVendorOrders.useQuery();

  // Filter orders from current month
  const currentMonthOrders = useMemo(() => {
    if (!orders) return [];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    });
  }, [orders]);

  // Calculate totals
  const totalOrders = currentMonthOrders.length;
  const totalSales = currentMonthOrders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.total || "0"), 0
  );
  const pendingOrders = currentMonthOrders.filter((order: any) => 
    order.status === "pending"
  ).length;
  const completedOrders = currentMonthOrders.filter((order: any) => 
    order.status === "completed" || order.status === "shipped"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Historial de Pedidos</h2>
        <p className="text-gray-600">Pedidos realizados este mes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pedidos</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Totales</p>
                <p className="text-2xl font-bold">${totalSales.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enviados</p>
                <p className="text-2xl font-bold">{completedOrders}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando pedidos...</p>
        </div>
      ) : currentMonthOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No hay pedidos este mes</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Pedido</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Hora</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Cliente</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Estado</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMonthOrders.map((order: any) => {
                    const orderDate = new Date(order.createdAt);
                    const isCompleted = order.status === "completed" || order.status === "shipped";
                    
                    return (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-semibold">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(orderDate, "dd/MM/yyyy", { locale: es })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {format(orderDate, "HH:mm", { locale: es })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-semibold text-sm">{order.customerName}</p>
                              <p className="text-xs text-gray-500">{order.customerContact}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-green-600">
                            ${parseFloat(order.total).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isCompleted 
                              ? "bg-green-100 text-green-800" 
                              : "bg-orange-100 text-orange-800"
                          }`}>
                            {isCompleted ? "Enviado" : "Pendiente"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

