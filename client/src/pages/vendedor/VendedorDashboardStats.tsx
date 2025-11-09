import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

/**
 * Sección de Dashboard para vendedores
 * Muestra estadísticas y métricas
 */
export default function VendedorDashboardStats() {
  const { data: clients, isLoading: clientsLoading } = trpc.users.getMyClients.useQuery();
  const { data: orders, isLoading: ordersLoading } = trpc.orders.getVendorOrders.useQuery();

  // Calculate statistics
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter((c: any) => c.isActive).length || 0;

  // Current month orders
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthOrders = orders?.filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    return (
      orderDate.getMonth() === currentMonth &&
      orderDate.getFullYear() === currentYear
    );
  }) || [];

  const totalOrders = currentMonthOrders.length;
  const totalSales = currentMonthOrders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.total || "0"), 0
  );

  // Previous month for growth calculation
  const previousMonthOrders = orders?.filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return (
      orderDate.getMonth() === prevMonth &&
      orderDate.getFullYear() === prevYear
    );
  }) || [];

  const previousMonthSales = previousMonthOrders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.total || "0"), 0
  );

  const growth = previousMonthSales > 0 
    ? ((totalSales - previousMonthSales) / previousMonthSales * 100).toFixed(1)
    : "0.0";

  const isLoading = clientsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-gray-600">Estadísticas y métricas de rendimiento</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {activeClients} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos del Mes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {previousMonthOrders.length} el mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${previousMonthSales.toFixed(2)} el mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(growth) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {parseFloat(growth) >= 0 ? "+" : ""}{growth}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {currentMonthOrders.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No hay actividad reciente este mes
            </p>
          ) : (
            <div className="space-y-4">
              {currentMonthOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                  <div>
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-sm text-gray-500">
                      Pedido #{order.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ${parseFloat(order.total).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

