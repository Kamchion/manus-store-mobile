import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Upload, Image as ImageIcon, Eye, Type } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LogoConfig() {
  const { data: config, isLoading, refetch } = trpc.config.getLogoConfig.useQuery();
  const [formData, setFormData] = useState({
    url: "",
    sizeNavbar: 120,
    sizeLogin: 200,
    sizeFooter: 100,
    sizeEmail: 150,
    loginText: "Plataforma B2B de Ventas Mayoristas",
    loginTextColor: "#374151",
    loginTextSize: 18,
    loginTextWeight: "500",
    loginTextAlign: "center",
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      setFormData({
        url: config.url,
        sizeNavbar: config.sizeNavbar,
        sizeLogin: config.sizeLogin,
        sizeFooter: config.sizeFooter,
        sizeEmail: config.sizeEmail,
        loginText: config.loginText || "Plataforma B2B de Ventas Mayoristas",
        loginTextColor: config.loginTextColor || "#374151",
        loginTextSize: config.loginTextSize || 18,
        loginTextWeight: config.loginTextWeight || "500",
        loginTextAlign: config.loginTextAlign || "center",
      });
    }
  }, [config]);

  const updateMutation = trpc.config.updateLogoConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuración de logo actualizada");
      refetch();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await response.json();
      setFormData({ ...formData, url: data.url });
      toast.success("Logo subido exitosamente");
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            Configuración de Logo
          </CardTitle>
          <CardDescription>
            Personaliza el logo de tu tienda y ajusta su tamaño para diferentes ubicaciones
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Subir Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo de la Tienda</CardTitle>
          <CardDescription>
            Sube tu logo personalizado (PNG, JPG, SVG - máx. 2MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logoUrl">URL del Logo</Label>
            <div className="flex gap-3">
              <Input
                id="logoUrl"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="/logo.png"
                className="flex-1"
              />
              <Button
                onClick={() => document.getElementById("fileInput")?.click()}
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Subir
              </Button>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Puedes ingresar una URL o subir un archivo desde tu computadora
            </p>
          </div>

          {/* Vista Previa */}
          {formData.url && (
            <div className="border rounded-lg p-6 bg-gray-50">
              <Label className="mb-3 block">Vista Previa</Label>
              <div className="flex justify-center">
                <img
                  src={formData.url}
                  alt="Logo Preview"
                  style={{ width: `${formData.sizeLogin}px` }}
                  className="object-contain"
                  onError={() => toast.error("Error al cargar la imagen")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tamaños por Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle>Tamaños por Ubicación</CardTitle>
          <CardDescription>
            Ajusta el tamaño del logo para cada ubicación (en píxeles)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Navbar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sizeNavbar">Barra de Navegación</Label>
              <span className="text-sm text-gray-500">{formData.sizeNavbar}px</span>
            </div>
            <Input
              id="sizeNavbar"
              type="range"
              min="30"
              max="200"
              value={formData.sizeNavbar}
              onChange={(e) => setFormData({ ...formData, sizeNavbar: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <div className="text-xs text-gray-600">Vista previa:</div>
              {formData.url && (
                <img
                  src={formData.url}
                  alt="Navbar Preview"
                  style={{ width: `${formData.sizeNavbar}px` }}
                  className="object-contain"
                />
              )}
            </div>
          </div>

          {/* Login */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sizeLogin">Página de Login</Label>
              <span className="text-sm text-gray-500">{formData.sizeLogin}px</span>
            </div>
            <Input
              id="sizeLogin"
              type="range"
              min="100"
              max="400"
              value={formData.sizeLogin}
              onChange={(e) => setFormData({ ...formData, sizeLogin: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <div className="text-xs text-gray-600">Vista previa:</div>
              {formData.url && (
                <img
                  src={formData.url}
                  alt="Login Preview"
                  style={{ width: `${formData.sizeLogin}px` }}
                  className="object-contain"
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sizeFooter">Pie de Página</Label>
              <span className="text-sm text-gray-500">{formData.sizeFooter}px</span>
            </div>
            <Input
              id="sizeFooter"
              type="range"
              min="50"
              max="150"
              value={formData.sizeFooter}
              onChange={(e) => setFormData({ ...formData, sizeFooter: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <div className="text-xs text-gray-600">Vista previa:</div>
              {formData.url && (
                <img
                  src={formData.url}
                  alt="Footer Preview"
                  style={{ width: `${formData.sizeFooter}px` }}
                  className="object-contain"
                />
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sizeEmail">Correos Electrónicos</Label>
              <span className="text-sm text-gray-500">{formData.sizeEmail}px</span>
            </div>
            <Input
              id="sizeEmail"
              type="range"
              min="80"
              max="250"
              value={formData.sizeEmail}
              onChange={(e) => setFormData({ ...formData, sizeEmail: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
              <div className="text-xs text-gray-600">Vista previa:</div>
              {formData.url && (
                <img
                  src={formData.url}
                  alt="Email Preview"
                  style={{ width: `${formData.sizeEmail}px` }}
                  className="object-contain"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Texto de Login */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Texto de Login
          </CardTitle>
          <CardDescription>
            Personaliza el texto que aparece debajo del logo en la página de login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contenido del Texto */}
          <div>
            <Label htmlFor="loginText">Texto</Label>
            <Input
              id="loginText"
              value={formData.loginText}
              onChange={(e) => setFormData({ ...formData, loginText: e.target.value })}
              placeholder="Plataforma B2B de Ventas Mayoristas"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Color */}
            <div>
              <Label htmlFor="loginTextColor">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="loginTextColor"
                  type="color"
                  value={formData.loginTextColor}
                  onChange={(e) => setFormData({ ...formData, loginTextColor: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.loginTextColor}
                  onChange={(e) => setFormData({ ...formData, loginTextColor: e.target.value })}
                  placeholder="#374151"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Tamaño */}
            <div>
              <Label htmlFor="loginTextSize">Tamaño (px)</Label>
              <Input
                id="loginTextSize"
                type="number"
                min="10"
                max="48"
                value={formData.loginTextSize}
                onChange={(e) => setFormData({ ...formData, loginTextSize: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Peso */}
            <div>
              <Label htmlFor="loginTextWeight">Peso</Label>
              <Select
                value={formData.loginTextWeight}
                onValueChange={(value) => setFormData({ ...formData, loginTextWeight: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alineación */}
            <div>
              <Label htmlFor="loginTextAlign">Alineación</Label>
              <Select
                value={formData.loginTextAlign}
                onValueChange={(value) => setFormData({ ...formData, loginTextAlign: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vista Previa */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <Label className="mb-3 block">Vista Previa</Label>
            <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-lg">
              {formData.url && (
                <img
                  src={formData.url}
                  alt="Logo"
                  style={{ width: `${formData.sizeLogin}px` }}
                  className="object-contain"
                />
              )}
              <p
                style={{
                  color: formData.loginTextColor,
                  fontSize: `${formData.loginTextSize}px`,
                  fontWeight: formData.loginTextWeight,
                  textAlign: formData.loginTextAlign as any,
                }}
              >
                {formData.loginText}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>

      {/* Guía Rápida */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>Formato:</strong> PNG con fondo transparente para mejor resultado</p>
          <p><strong>Dimensiones:</strong> Mínimo 500x500px para calidad óptima</p>
          <p><strong>Tamaño de archivo:</strong> Máximo 2MB</p>
          <p><strong>Proporción:</strong> Cuadrada o rectangular horizontal funciona mejor</p>
          <p className="mt-3"><strong>Tamaños recomendados:</strong></p>
          <ul className="list-disc list-inside ml-2">
            <li>Navbar: 100-150px</li>
            <li>Login: 180-250px</li>
            <li>Footer: 80-120px</li>
            <li>Email: 120-180px</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

