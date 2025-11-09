import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { getErrorMessage } from "@/lib/errorUtils";

export default function EmailConfig() {
  const { data: config, isLoading, refetch } = trpc.config.getSmtpConfig.useQuery();
  const [testEmail, setTestEmail] = useState("");

  const [formData, setFormData] = useState({
    host: "",
    port: "",
    secure: "tls",
    user: "",
    password: "",
    fromName: "",
    fromEmail: "",
    recipientEmail: "",
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      setFormData({
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        password: config.password,
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        recipientEmail: config.recipientEmail || config.user,
      });
    }
  }, [config]);

  const updateMutation = trpc.config.updateSmtpConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuración SMTP actualizada");
      refetch();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const testEmailMutation = trpc.config.sendTestEmail.useMutation({
    onSuccess: () => {
      toast.success("Email de prueba enviado exitosamente");
      setTestEmail("");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast.error("Por favor ingresa un email de destino");
      return;
    }
    testEmailMutation.mutate({ to: testEmail });
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
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Configuración de Correo Electrónico
          </CardTitle>
          <CardDescription>
            Configura tu servidor SMTP para enviar correos electrónicos desde tu tienda.
            Esta configuración te permite migrar a cualquier proveedor sin cambiar código.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuración del Servidor SMTP */}
      <Card>
        <CardHeader>
          <CardTitle>Servidor SMTP</CardTitle>
          <CardDescription>
            Configura los detalles de tu servidor de correo saliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="host">Servidor SMTP</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="smtp.gmail.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ejemplo: smtp.gmail.com, smtp.office365.com
              </p>
            </div>

            <div>
              <Label htmlFor="port">Puerto</Label>
              <Input
                id="port"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder="587"
              />
              <p className="text-xs text-gray-500 mt-1">
                587 (TLS) o 465 (SSL)
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="secure">Seguridad</Label>
            <Select
              value={formData.secure}
              onValueChange={(value) => setFormData({ ...formData, secure: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS (recomendado)</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="none">Sin encriptación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Autenticación */}
      <Card>
        <CardHeader>
          <CardTitle>Autenticación</CardTitle>
          <CardDescription>
            Credenciales para autenticarse en el servidor SMTP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="user">Usuario / Email</Label>
            <Input
              id="user"
              type="email"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              placeholder="tu-email@gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">
              Para Gmail, usa una "Contraseña de aplicación" en lugar de tu contraseña normal
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remitente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Remitente</CardTitle>
          <CardDescription>
            Cómo aparecerá tu tienda en los correos enviados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fromName">Nombre del Remitente</Label>
            <Input
              id="fromName"
              value={formData.fromName}
              onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
              placeholder="IMPORKAM Tienda"
            />
          </div>

          <div>
            <Label htmlFor="fromEmail">Email del Remitente</Label>
            <Input
              id="fromEmail"
              type="email"
              value={formData.fromEmail}
              onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
              placeholder="noreply@tutienda.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Debe ser el mismo email o un alias autorizado del usuario SMTP
            </p>
          </div>

          <div>
            <Label htmlFor="recipientEmail">Email Destinatario de Pedidos</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
              placeholder="pedidos@tutienda.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email donde se recibirán los pedidos con archivos PDF y Excel adjuntos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Probar Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Probar Configuración
          </CardTitle>
          <CardDescription>
            Envía un email de prueba para verificar que la configuración funciona
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="destinatario@ejemplo.com"
              />
            </div>
            <Button
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending || !testEmail}
              variant="outline"
            >
              {testEmailMutation.isPending ? "Enviando..." : "Enviar Prueba"}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Asegúrate de guardar la configuración antes de enviar el email de prueba
          </p>
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

      {/* Guías de Configuración */}
      <div className="space-y-4">
        {/* Gmail */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Guía de Configuración - Gmail
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-semibold mb-2">Pasos para configurar:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Ve a tu cuenta de Google → <strong>Seguridad</strong></li>
                <li>Activa la <strong>Verificación en 2 pasos</strong></li>
                <li>Busca <strong>"Contraseñas de aplicación"</strong></li>
                <li>Selecciona "Correo" como aplicación</li>
                <li>Copia la contraseña de 16 caracteres generada</li>
                <li>Usa esa contraseña aquí (NO tu contraseña de Gmail)</li>
              </ol>
            </div>
            <div className="bg-white p-3 rounded border border-blue-300">
              <p className="font-semibold mb-2">Configuración:</p>
              <ul className="space-y-1">
                <li>• <strong>Servidor:</strong> smtp.gmail.com</li>
                <li>• <strong>Puerto:</strong> 587</li>
                <li>• <strong>Seguridad:</strong> TLS</li>
                <li>• <strong>Usuario:</strong> tu-email@gmail.com</li>
                <li>• <strong>Contraseña:</strong> [contraseña de aplicación]</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Outlook/Office 365 */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Guía de Configuración - Outlook / Office 365
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-purple-800 space-y-3">
            <div>
              <p className="font-semibold mb-2">Pasos para configurar:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Inicia sesión en tu cuenta de Microsoft</li>
                <li>Ve a <strong>Seguridad</strong> → <strong>Opciones de seguridad avanzadas</strong></li>
                <li>Busca <strong>"Verificación en dos pasos"</strong> y actívala</li>
                <li>Crea una <strong>"Contraseña de aplicación"</strong></li>
                <li>Usa esa contraseña para autenticarte</li>
              </ol>
            </div>
            <div className="bg-white p-3 rounded border border-purple-300">
              <p className="font-semibold mb-2">Configuración:</p>
              <ul className="space-y-1">
                <li>• <strong>Servidor:</strong> smtp.office365.com</li>
                <li>• <strong>Puerto:</strong> 587</li>
                <li>• <strong>Seguridad:</strong> TLS</li>
                <li>• <strong>Usuario:</strong> tu-email@outlook.com</li>
                <li>• <strong>Contraseña:</strong> [contraseña de aplicación]</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Otros Proveedores */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Otros Proveedores de Correo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-800 space-y-3">
            <div className="bg-white p-3 rounded border border-green-300">
              <p className="font-semibold mb-2">Yahoo Mail:</p>
              <ul className="space-y-1">
                <li>• <strong>Servidor:</strong> smtp.mail.yahoo.com</li>
                <li>• <strong>Puerto:</strong> 587 (TLS) o 465 (SSL)</li>
                <li>• <strong>Nota:</strong> Requiere contraseña de aplicación</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded border border-green-300">
              <p className="font-semibold mb-2">Zoho Mail:</p>
              <ul className="space-y-1">
                <li>• <strong>Servidor:</strong> smtp.zoho.com</li>
                <li>• <strong>Puerto:</strong> 587 (TLS)</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded border border-green-300">
              <p className="font-semibold mb-2">SendGrid / Mailgun / Amazon SES:</p>
              <ul className="space-y-1">
                <li>• Consulta la documentación de tu proveedor</li>
                <li>• Generalmente requieren API keys o credenciales SMTP específicas</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Consejos de Seguridad */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Consejos de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-800 space-y-2">
            <p>• <strong>Nunca uses tu contraseña principal</strong> - Siempre usa contraseñas de aplicación</p>
            <p>• <strong>Activa la verificación en 2 pasos</strong> en tu cuenta de correo</p>
            <p>• <strong>Usa TLS/SSL</strong> para encriptar la comunicación</p>
            <p>• <strong>Verifica el puerto correcto</strong>: 587 (TLS) o 465 (SSL)</p>
            <p>• <strong>Revisa los límites de envío</strong> de tu proveedor para evitar bloqueos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

