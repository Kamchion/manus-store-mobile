import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingCart, Users, BarChart3, History, LogOut, RefreshCw } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { useLocation, useSearch } from "wouter";
import VendedorPedidos from "./vendedor/VendedorPedidos";
import VendedorClientes from "./vendedor/VendedorClientes";
import VendedorDashboardStats from "./vendedor/VendedorDashboardStats";
import VendedorHistorial from "./vendedor/VendedorHistorial";
import { VendedorSyncPanel } from "@/components/VendedorSyncPanel";

/**
 * Dashboard principal para vendedores
 * Muestra 4 opciones principales: Pedidos, Clientes, Dashboard, Historial
 */
export default function VendedorDashboard() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const searchParams = useSearch();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Resetear selectedSection cuando se detecta el parámetro reset
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get('reset') === 'true') {
      setSelectedSection(null);
      // Limpiar el parámetro de la URL
      setLocation('/vendedor', { replace: true });
    }
  }, [searchParams, setLocation]);

  if (!user || user.role !== "vendedor") {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Acceso denegado. Solo vendedores pueden ver esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  // Si no hay sección seleccionada, mostrar las 4 opciones principales
  if (!selectedSection) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Panel de Vendedor</h1>
          <p className="text-gray-600">Bienvenido, {user.name || user.username}</p>
          <p className="text-sm text-gray-500">Agente: {user.username}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Pedidos */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
            onClick={() => setSelectedSection('pedidos')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Crear nuevos pedidos para tus clientes
              </p>
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
            onClick={() => setSelectedSection('clientes')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Clientes</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Gestionar tu cartera de clientes
              </p>
            </CardContent>
          </Card>

          {/* Dashboard */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
            onClick={() => setSelectedSection('dashboard')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Ver estadísticas y métricas
              </p>
            </CardContent>
          </Card>

          {/* Historial */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-500"
            onClick={() => setSelectedSection('historial')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <History className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Historial</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Ver pedidos realizados este mes
              </p>
            </CardContent>
          </Card>

          {/* Sincronización (solo en móvil) */}
          {Capacitor.isNativePlatform() && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-cyan-500"
              onClick={() => setSelectedSection('sync')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="h-8 w-8 text-cyan-600" />
                </div>
                <CardTitle className="text-2xl">Sincronización</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Gestionar datos offline
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Botón Salir de la Tienda */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogout}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Salir de la Tienda
          </Button>
        </div>
      </div>
    );
  }

  // Renderizar la sección seleccionada
  return (
    <div className="container mx-auto px-4 py-6">

      {selectedSection === 'pedidos' && <VendedorPedidos />}
      {selectedSection === 'clientes' && <VendedorClientes />}
      {selectedSection === 'dashboard' && <VendedorDashboardStats />}
      {selectedSection === 'historial' && <VendedorHistorial />}
      {selectedSection === 'sync' && <VendedorSyncPanel />}
    </div>
  );
}

