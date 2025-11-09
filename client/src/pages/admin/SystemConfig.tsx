import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Bell } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";

export default function SystemConfig() {
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [timezone, setTimezone] = useState("America/Asuncion");
  const [currency, setCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [storeName, setStoreName] = useState("IMPORKAM");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  // Get current configuration
  const { data: config, isLoading, refetch } = trpc.config.getAll.useQuery();

  // Update configuration mutation
  const updateConfigMutation = trpc.config.update.useMutation({
    onSuccess: () => {
      toast.success("Configuración actualizada correctamente");
      refetch();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Load configuration when data is available
  useEffect(() => {
    if (config) {
      setPopupEnabled(config.popup_enabled === "true");
      setPopupTitle(config.popup_title || "");
      setPopupMessage(config.popup_message || "");
      setTaxRate(config.tax_rate || "10");
      setTimezone(config.timezone || "America/Asuncion");
      setCurrency(config.currency || "USD");
      setCurrencySymbol(config.currency_symbol || "$");
      setStoreName(config.store_name || "IMPORKAM");
      setStorePhone(config.store_phone || "");
      setStoreAddress(config.store_address || "");
    }
  }, [config]);

  const handleSave = () => {
    updateConfigMutation.mutate({
      popupEnabled,
      popupTitle: popupTitle || undefined,
      popupMessage: popupMessage || undefined,
      taxRate: taxRate || undefined,
      timezone: timezone || undefined,
      currency: currency || undefined,
      currencySymbol: currencySymbol || undefined,
      storeName: storeName || undefined,
      storePhone: storePhone || undefined,
      storeAddress: storeAddress || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-2">
          Gestiona la configuración general, financiera, emails y anuncios de la tienda
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Popup Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <CardTitle>Pop-up de Anuncios al Login</CardTitle>
            </div>
            <CardDescription>
              Configura un mensaje que se mostrará a los clientes al iniciar sesión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="popupEnabled">Activar Pop-up</Label>
                <p className="text-sm text-gray-500">
                  Mostrar mensaje al iniciar sesión
                </p>
              </div>
              <Switch
                id="popupEnabled"
                checked={popupEnabled}
                onCheckedChange={setPopupEnabled}
              />
            </div>

            {popupEnabled && (
              <>
                <div>
                  <Label htmlFor="popupTitle">Título del Anuncio</Label>
                  <Input
                    id="popupTitle"
                    type="text"
                    value={popupTitle ?? ""}
                    onChange={(e) => setPopupTitle(e.target.value)}
                    placeholder="¡Bienvenido!"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="popupMessage">Mensaje del Anuncio</Label>
                  <Textarea
                    id="popupMessage"
                    value={popupMessage ?? ""}
                    onChange={(e) => setPopupMessage(e.target.value)}
                    placeholder="Tenemos nuevos productos disponibles..."
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Este mensaje se mostrará a los clientes cuando inicien sesión
                  </p>
                </div>

                {/* Preview */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                  <div className="bg-white rounded-lg p-4 shadow-lg max-w-md">
                    <h3 className="text-lg font-bold mb-2">{popupTitle || "Título"}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {popupMessage || "Mensaje del anuncio..."}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* General Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>
              Configuración básica de la tienda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Nombre de la Tienda</Label>
                <Input
                  id="storeName"
                  type="text"
                  value={storeName ?? ""}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="IMPORKAM"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="storePhone">Teléfono de Contacto</Label>
                <Input
                  id="storePhone"
                  type="tel"
                  value={storePhone ?? ""}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="+595 21 123 4567"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="storeAddress">Dirección de la Tienda</Label>
              <Textarea
                id="storeAddress"
                value={storeAddress ?? ""}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Av. Principal 123, Asunción, Paraguay"
                rows={2}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Financiera</CardTitle>
            <CardDescription>
              Configuración de impuestos y moneda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate ?? ""}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="10"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Porcentaje de impuesto aplicado a los pedidos
                </p>
              </div>
              
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  value={currency ?? "USD"}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="PYG">Guaraní Paraguayo (PYG)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="BRL">Real Brasileño (BRL)</option>
                  <option value="ARS">Peso Argentino (ARS)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currencySymbol">Símbolo de Moneda</Label>
                <Input
                  id="currencySymbol"
                  type="text"
                  maxLength={3}
                  value={currencySymbol ?? "$"}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="$"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="timezone">Zona Horaria</Label>
                <select
                  id="timezone"
                  value={timezone ?? "America/Asuncion"}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/Asuncion">América/Asunción (Paraguay)</option>
                  <option value="America/Buenos_Aires">América/Buenos Aires (Argentina)</option>
                  <option value="America/Sao_Paulo">América/São Paulo (Brasil)</option>
                  <option value="America/Santiago">América/Santiago (Chile)</option>
                  <option value="America/Montevideo">América/Montevideo (Uruguay)</option>
                  <option value="America/Lima">América/Lima (Perú)</option>
                  <option value="America/Bogota">América/Bogotá (Colombia)</option>
                  <option value="America/Mexico_City">América/Ciudad de México (México)</option>
                  <option value="America/New_York">América/Nueva York (EE.UU. Este)</option>
                  <option value="America/Los_Angeles">América/Los Ángeles (EE.UU. Oeste)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
            size="lg"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {updateConfigMutation.isPending ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </div>
    </div>
  );
}

