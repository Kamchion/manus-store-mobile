import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, User, Mail, Phone, Building, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";

/**
 * Sección de Clientes para vendedores
 * Muestra listado completo de clientes con opciones de CRUD
 */
export default function VendedorClientes() {
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state for new client
  const [newClientData, setNewClientData] = useState({
    clientNumber: `CLI-${Date.now().toString().slice(-6)}`,
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    gpsLocation: "",
    companyTaxId: "",
    priceType: "ciudad" as "ciudad" | "interior" | "especial",
  });

  // Get vendor's clients
  const { data: clients, isLoading, refetch } = trpc.users.getMyClients.useQuery();

  // Create client mutation
  const createClientMutation = trpc.users.createClient.useMutation({
    onSuccess: (data) => {
      toast.success(`Cliente creado exitosamente. Usuario: ${data.username} | Contraseña: ${data.tempPassword}`, {
        duration: 10000,
      });
      setShowNewClientDialog(false);
      setNewClientData({
        clientNumber: `CLI-${Date.now().toString().slice(-6)}`,
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        gpsLocation: "",
        companyTaxId: "",
        priceType: "ciudad",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Error al crear cliente");
    },
  });

  // Update client mutation
  const updateClientMutation = trpc.users.updateClient.useMutation({
    onSuccess: () => {
      toast.success("Cliente actualizado exitosamente");
      setShowEditClientDialog(false);
      setEditingClient(null);
      refetch();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Error al actualizar cliente");
    },
  });

  // Filter clients based on search
  const filteredClients = clients?.filter((client: any) =>
    client.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateClient = () => {
    createClientMutation.mutate(newClientData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Mis Clientes</h2>
          <p className="text-gray-600">Gestiona tu cartera de clientes</p>
        </div>
        <Button onClick={() => setShowNewClientDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, contacto, email o teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">
              {searchQuery ? "No se encontraron clientes" : "No tienes clientes registrados"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowNewClientDialog(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear tu primer cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client: any) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{client.companyName}</CardTitle>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    client.priceType === "ciudad" ? "bg-blue-100 text-blue-800" :
                    client.priceType === "interior" ? "bg-green-100 text-green-800" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    {client.priceType || "ciudad"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{client.contactPerson || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{client.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span className="font-mono text-xs">{client.clientNumber || client.username}</span>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    client.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {client.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setEditingClient(client);
                      setShowEditClientDialog(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Client Dialog */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="clientNumber">ID del Cliente *</Label>
              <Input
                id="clientNumber"
                value={newClientData.clientNumber}
                onChange={(e) => setNewClientData({ ...newClientData, clientNumber: e.target.value })}
                placeholder="Ej: CLI-001"
              />
              <p className="text-xs text-gray-500 mt-1">Se genera automáticamente, pero puedes modificarlo</p>
            </div>

            <div>
              <Label htmlFor="companyName">Nombre de la Empresa *</Label>
              <Input
                id="companyName"
                value={newClientData.companyName}
                onChange={(e) => setNewClientData({ ...newClientData, companyName: e.target.value })}
                placeholder="Ej: Distribuidora ABC"
              />
            </div>

            <div>
              <Label htmlFor="contactPerson">Persona de Contacto *</Label>
              <Input
                id="contactPerson"
                value={newClientData.contactPerson}
                onChange={(e) => setNewClientData({ ...newClientData, contactPerson: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                placeholder="Ej: contacto@empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                placeholder="Ej: +595 21 123456"
              />
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={newClientData.address}
                onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                placeholder="Ej: Av. Principal 123, Asunción"
              />
            </div>

            <div>
              <Label htmlFor="gpsLocation">Ubicación GPS</Label>
              <div className="flex gap-2">
                <Input
                  id="gpsLocation"
                  value={newClientData.gpsLocation}
                  onChange={(e) => setNewClientData({ ...newClientData, gpsLocation: e.target.value })}
                  placeholder="Latitud, Longitud"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords;
                          setNewClientData({
                            ...newClientData,
                            gpsLocation: `${latitude},${longitude}`,
                          });
                          toast.success("Ubicación capturada correctamente");
                        },
                        (error) => {
                          toast.error("No se pudo obtener la ubicación");
                        }
                      );
                    } else {
                      toast.error("Tu navegador no soporta geolocalización");
                    }
                  }}
                >
                  📍 Capturar
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Haz clic en "Capturar" para obtener la ubicación actual</p>
            </div>

            <div>
              <Label htmlFor="companyTaxId">RUC</Label>
              <Input
                id="companyTaxId"
                value={newClientData.companyTaxId}
                onChange={(e) => setNewClientData({ ...newClientData, companyTaxId: e.target.value })}
                placeholder="Ej: 80012345-6"
              />
            </div>

            <div>
              <Label htmlFor="priceType">Tipo de Precio *</Label>
              <Select
                value={newClientData.priceType}
                onValueChange={(value: "ciudad" | "interior" | "especial") =>
                  setNewClientData({ ...newClientData, priceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ciudad">Ciudad</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="especial">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setShowNewClientDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={
                  !newClientData.companyName ||
                  !newClientData.contactPerson ||
                  !newClientData.phone ||
                  createClientMutation.isPending
                }
                className="flex-1"
              >
                {createClientMutation.isPending ? "Creando..." : "Crear Cliente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditClientDialog} onOpenChange={setShowEditClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>

          {editingClient && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-clientNumber">ID del Cliente</Label>
                <Input
                  id="edit-clientNumber"
                  value={editingClient.clientNumber || editingClient.username}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="edit-companyName">Nombre de la Empresa *</Label>
                <Input
                  id="edit-companyName"
                  value={editingClient.companyName || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, companyName: e.target.value })}
                  placeholder="Ej: Distribuidora ABC S.A."
                />
              </div>

              <div>
                <Label htmlFor="edit-contactPerson">Persona de Contacto *</Label>
                <Input
                  id="edit-contactPerson"
                  value={editingClient.contactPerson || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, contactPerson: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingClient.email || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  placeholder="Ej: contacto@empresa.com"
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">Teléfono *</Label>
                <Input
                  id="edit-phone"
                  value={editingClient.phone || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                  placeholder="Ej: +507 6123-4567"
                />
              </div>

              <div>
                <Label htmlFor="edit-address">Dirección</Label>
                <Input
                  id="edit-address"
                  value={editingClient.address || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  placeholder="Ej: Calle 50, Ciudad de Panamá"
                />
              </div>

              <div>
                <Label htmlFor="edit-gpsLocation">Ubicación GPS</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-gpsLocation"
                    value={editingClient.gpsLocation || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, gpsLocation: e.target.value })}
                    placeholder="Latitud, Longitud"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const { latitude, longitude } = position.coords;
                            setEditingClient({ ...editingClient, gpsLocation: `${latitude}, ${longitude}` });
                          },
                          (error) => {
                            console.error("Error obteniendo ubicación:", error);
                            alert("No se pudo obtener la ubicación. Verifica los permisos del navegador.");
                          }
                        );
                      } else {
                        alert("Tu navegador no soporta geolocalización.");
                      }
                    }}
                  >
                    📍 Obtener ubicación
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-companyTaxId">RUC</Label>
                <Input
                  id="edit-companyTaxId"
                  value={editingClient.companyTaxId || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, companyTaxId: e.target.value })}
                  placeholder="Ej: 80012345-6"
                />
              </div>

              <div>
                <Label htmlFor="edit-priceType">Tipo de Precio *</Label>
                <Select
                  value={editingClient.priceType || "ciudad"}
                  onValueChange={(value: "ciudad" | "interior" | "especial") =>
                    setEditingClient({ ...editingClient, priceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ciudad">Ciudad</SelectItem>
                    <SelectItem value="interior">Interior</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowEditClientDialog(false);
                    setEditingClient(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!editingClient.companyName || !editingClient.contactPerson) {
                      toast.error("El nombre de la empresa y persona de contacto son requeridos");
                      return;
                    }
                    updateClientMutation.mutate({
                      clientId: editingClient.id,
                      companyName: editingClient.companyName,
                      contactPerson: editingClient.contactPerson,
                      email: editingClient.email || "",
                      phone: editingClient.phone,
                      address: editingClient.address,
                      gpsLocation: editingClient.gpsLocation,
                      companyTaxId: editingClient.companyTaxId,
                      priceType: editingClient.priceType,
                    });
                  }}
                  disabled={updateClientMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {updateClientMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

