import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, User } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";

/**
 * Sección de Pedidos para vendedores
 * Muestra popup para seleccionar cliente y crear pedido
 */
export default function VendedorPedidos() {
  const [, setLocation] = useLocation();

  const [showClientDialog, setShowClientDialog] = useState(true);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Form state for new client
  const [newClientData, setNewClientData] = useState({
    clientNumber: `CLI-${Date.now().toString().slice(-6)}`,
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    companyTaxId: "",
    priceType: "ciudad" as "ciudad" | "interior" | "especial",
    gpsLocation: "",
  });
  
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get vendor's clients
  const { data: clients, isLoading, refetch } = trpc.users.getMyClients.useQuery();
  
  // Geolocation function
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const gpsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setNewClientData({ ...newClientData, gpsLocation: gpsString });
        toast.success("Ubicación obtenida correctamente");
        setIsGettingLocation(false);
      },
      (error) => {
        toast.error("Error al obtener ubicación: " + error.message);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Create client mutation
  const createClientMutation = trpc.users.createClient.useMutation({
    onSuccess: () => {
      toast.success("Cliente creado exitosamente");
      setShowNewClientDialog(false);
      setNewClientData({
        clientNumber: `CLI-${Date.now().toString().slice(-6)}`,
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        companyTaxId: "",
        priceType: "ciudad",
        gpsLocation: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Error al crear cliente");
    },
  });

  // Filter clients based on search
  const filteredClients = clients?.filter((client: any) =>
    client.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSelectClient = (clientId: string) => {
    setSelectedClient(clientId);
    // Store selected client in localStorage for use in catalog
    localStorage.setItem('selectedClientId', clientId);
    // Redirect to catalog
    setLocation('/products');
  };

  const handleCreateClient = () => {
    createClientMutation.mutate(newClientData);
  };

  return (
    <>
      {/* Client Selection Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar cliente por nombre, contacto o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Create New Client Button */}
            <Button
              onClick={() => setShowNewClientDialog(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Cliente
            </Button>

            {/* Client List */}
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Cargando clientes...</div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No se encontraron clientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map((client: any) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client.id)}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{client.companyName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Contacto:</span> {client.contactPerson}
                        </p>
                        {client.address && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Dirección:</span> {client.address}
                          </p>
                        )}
                        {client.phone && (
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Teléfono:</span> {client.phone}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        client.priceType === "ciudad" ? "bg-blue-100 text-blue-800" :
                        client.priceType === "interior" ? "bg-green-100 text-green-800" :
                        "bg-purple-100 text-purple-800"
                      }`}>
                        {client.priceType || "ciudad"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="companyTaxId">RUC</Label>
              <Input
                id="companyTaxId"
                value={newClientData.companyTaxId}
                onChange={(e) => setNewClientData({ ...newClientData, companyTaxId: e.target.value })}
                placeholder="Ej: 80012345-6"
              />
            </div>

            <div>
              <Label htmlFor="gpsLocation">Ubicación GPS</Label>
              <div className="flex gap-2">
                <Input
                  id="gpsLocation"
                  value={newClientData.gpsLocation}
                  onChange={(e) => setNewClientData({ ...newClientData, gpsLocation: e.target.value })}
                  placeholder="Ej: -25.263740, -57.575926"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  variant="outline"
                  className="shrink-0"
                >
                  {isGettingLocation ? "Obteniendo..." : "📍"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Haz clic en el botón para obtener la ubicación actual</p>
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
    </>
  );
}

