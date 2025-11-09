# Configuración de Correo Electrónico SMTP - IMPORKAM

## 📧 Descripción

Se ha implementado un sistema completo de configuración de correo electrónico SMTP que permite configurar el envío de emails desde el panel de administración, sin necesidad de modificar código. Esto facilita la migración entre proveedores de email y proporciona control total sobre la configuración.

## ✨ Funcionalidades Implementadas

### 1. Configuración de Servidor SMTP
- **Host**: Servidor SMTP (smtp.gmail.com, smtp.office365.com, etc.)
- **Puerto**: Puerto de conexión (587 para TLS, 465 para SSL)
- **Seguridad**: TLS, SSL o sin encriptación

### 2. Autenticación
- **Usuario**: Email o nombre de usuario SMTP
- **Contraseña**: Contraseña o contraseña de aplicación

### 3. Información del Remitente
- **Nombre del Remitente**: Cómo aparecerá tu tienda
- **Email del Remitente**: Email desde el que se envían los correos

### 4. Prueba de Configuración
- **Envío de Email de Prueba**: Verifica que la configuración funciona correctamente
- **Feedback inmediato**: Mensajes de éxito o error detallados

### 5. Guía Rápida Integrada
- **Instrucciones para Gmail**: Paso a paso para configurar Gmail
- **Ejemplos de configuración**: Para diferentes proveedores

## 🗄️ Estructura de Base de Datos

Se agregaron las siguientes claves en `systemConfig`:

| Clave | Descripción | Valor por Defecto |
|-------|-------------|-------------------|
| `smtp_host` | Servidor SMTP | smtp.gmail.com |
| `smtp_port` | Puerto SMTP | 587 |
| `smtp_secure` | Tipo de seguridad | tls |
| `smtp_user` | Usuario SMTP | (vacío) |
| `smtp_password` | Contraseña SMTP | (vacío) |
| `smtp_from_name` | Nombre del remitente | IMPORKAM Tienda |
| `smtp_from_email` | Email del remitente | (vacío) |

## 🔌 Endpoints Backend

### `config.getSmtpConfig`
**Tipo**: Query (protegido, solo administradores)  
**Descripción**: Obtiene la configuración SMTP actual

**Respuesta**:
```typescript
{
  host: string;
  port: string;
  secure: string;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}
```

### `config.updateSmtpConfig`
**Tipo**: Mutation (protegido, solo administradores)  
**Descripción**: Actualiza la configuración SMTP

**Input**:
```typescript
{
  host: string;
  port: string;
  secure: string;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}
```

### `config.sendTestEmail`
**Tipo**: Mutation (protegido, solo administradores)  
**Descripción**: Envía un email de prueba

**Input**:
```typescript
{
  to: string; // Email de destino
}
```

**Respuesta**:
```typescript
{
  success: boolean;
  message: string;
}
```

## 🎨 Componente Frontend

### `EmailConfig.tsx`
Ubicación: `client/src/pages/admin/EmailConfig.tsx`

**Características**:
- Formulario completo para configuración SMTP
- Validación de campos
- Envío de email de prueba
- Guía rápida para Gmail
- Feedback visual con toast notifications
- Diseño responsive con Tailwind CSS

## 📱 Interfaz de Usuario

### Acceso
1. **Panel de Administración** (como administrador)
2. Clic en **"Configuración"**
3. Seleccionar sub-pestaña **"Correo Electrónico"**

### Secciones

#### 1. Servidor SMTP
- Campo: Servidor SMTP
- Campo: Puerto
- Selector: Seguridad (TLS/SSL/None)

#### 2. Autenticación
- Campo: Usuario / Email
- Campo: Contraseña (tipo password)
- Ayuda: Instrucciones para contraseña de aplicación

#### 3. Información del Remitente
- Campo: Nombre del Remitente
- Campo: Email del Remitente

#### 4. Probar Configuración
- Campo: Email de destino
- Botón: "Enviar Prueba"

#### 5. Guía Rápida - Gmail
- Instrucciones paso a paso
- Configuración recomendada
- Enlace a contraseñas de aplicación

## 🔧 Configuración por Proveedor

### Gmail

**Requisitos**:
- Verificación en 2 pasos activada
- Contraseña de aplicación generada

**Configuración**:
```
Servidor: smtp.gmail.com
Puerto: 587
Seguridad: TLS
Usuario: tu-email@gmail.com
Contraseña: [contraseña de aplicación de 16 caracteres]
Email Remitente: tu-email@gmail.com
```

**Pasos**:
1. Ve a https://myaccount.google.com/security
2. Activa la verificación en 2 pasos
3. Busca "Contraseñas de aplicación"
4. Genera una contraseña para "Correo"
5. Usa esa contraseña en la configuración

### Office 365 / Outlook

**Configuración**:
```
Servidor: smtp.office365.com
Puerto: 587
Seguridad: TLS
Usuario: tu-email@outlook.com
Contraseña: [tu contraseña de Outlook]
Email Remitente: tu-email@outlook.com
```

### SendGrid

**Configuración**:
```
Servidor: smtp.sendgrid.net
Puerto: 587
Seguridad: TLS
Usuario: apikey
Contraseña: [tu API key de SendGrid]
Email Remitente: noreply@tudominio.com
```

### Mailgun

**Configuración**:
```
Servidor: smtp.mailgun.org
Puerto: 587
Seguridad: TLS
Usuario: postmaster@tudominio.mailgun.org
Contraseña: [tu contraseña de Mailgun]
Email Remitente: noreply@tudominio.com
```

## 🚀 Uso en la Aplicación

### Enviar Email Programáticamente

```typescript
import nodemailer from "nodemailer";
import { getDb } from "../db";
import { systemConfig } from "../drizzle/schema";

async function sendEmail(to: string, subject: string, html: string) {
  const db = await getDb();
  const configs = await db.select().from(systemConfig);
  
  const smtpConfig = {
    host: configs.find(c => c.key === "smtp_host")?.value || "smtp.gmail.com",
    port: parseInt(configs.find(c => c.key === "smtp_port")?.value || "587"),
    secure: configs.find(c => c.key === "smtp_secure")?.value === "ssl",
    auth: {
      user: configs.find(c => c.key === "smtp_user")?.value || "",
      pass: configs.find(c => c.key === "smtp_password")?.value || "",
    },
  };

  const fromName = configs.find(c => c.key === "smtp_from_name")?.value || "IMPORKAM Tienda";
  const fromEmail = configs.find(c => c.key === "smtp_from_email")?.value || "";

  const transporter = nodemailer.createTransport(smtpConfig);

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });
}
```

### Casos de Uso

1. **Confirmación de Pedido**
```typescript
await sendEmail(
  customer.email,
  "Confirmación de Pedido #" + orderId,
  `<h1>Gracias por tu pedido</h1>...`
);
```

2. **Recuperación de Contraseña**
```typescript
await sendEmail(
  user.email,
  "Recuperar Contraseña",
  `<p>Haz clic aquí para recuperar tu contraseña: ${resetLink}</p>`
);
```

3. **Notificaciones de Stock**
```typescript
await sendEmail(
  admin.email,
  "Alerta de Stock Bajo",
  `<p>El producto ${product.name} tiene stock bajo: ${product.stock} unidades</p>`
);
```

## ⚠️ Consideraciones de Seguridad

### 1. Contraseñas
- **Nunca** expongas las contraseñas SMTP en el frontend
- Las contraseñas se almacenan en la base de datos (considera encriptación adicional)
- Usa contraseñas de aplicación en lugar de contraseñas principales

### 2. Límites de Envío
- **Gmail**: ~500 emails/día para cuentas gratuitas
- **Office 365**: ~10,000 emails/día
- **SendGrid/Mailgun**: Según tu plan

### 3. Autenticación SPF/DKIM
- Configura registros SPF en tu dominio
- Configura DKIM para mejorar la entregabilidad
- Verifica tu dominio en el proveedor SMTP

### 4. Rate Limiting
- Implementa rate limiting para prevenir abuso
- Monitorea el uso de envío de emails
- Implementa colas para envíos masivos

## 📊 Monitoreo y Logs

### Auditoría
Cada acción se registra en la tabla `auditLog`:

- `SMTP_CONFIG_UPDATED`: Cuando se actualiza la configuración
- `TEST_EMAIL_SENT`: Cuando se envía un email de prueba

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Authentication failed" | Credenciales incorrectas | Verifica usuario y contraseña |
| "Connection timeout" | Firewall o puerto bloqueado | Verifica firewall y puerto |
| "Invalid email" | Email de remitente inválido | Usa un email válido y autorizado |
| "Quota exceeded" | Límite de envío alcanzado | Espera o cambia de proveedor |

## 🔄 Migración de Proveedores

### Ventajas del Sistema
1. **Sin cambios de código**: Solo actualiza la configuración
2. **Prueba antes de cambiar**: Envía emails de prueba
3. **Rollback rápido**: Vuelve a la configuración anterior
4. **Sin downtime**: Cambio instantáneo

### Proceso de Migración

1. **Preparar nuevo proveedor**
   - Crea cuenta en nuevo proveedor
   - Obtén credenciales SMTP
   - Configura SPF/DKIM

2. **Configurar en IMPORKAM**
   - Ve a Configuración → Correo Electrónico
   - Ingresa nueva configuración
   - **NO guardes todavía**

3. **Probar**
   - Envía email de prueba
   - Verifica recepción
   - Revisa spam/junk

4. **Aplicar**
   - Si la prueba fue exitosa, guarda
   - Monitorea los primeros envíos
   - Verifica logs de auditoría

5. **Rollback (si es necesario)**
   - Vuelve a la configuración anterior
   - Guarda
   - Prueba nuevamente

## 📚 Dependencias

### Backend
- `nodemailer`: ^7.0.0 - Cliente SMTP para Node.js
- `@types/nodemailer`: ^7.0.2 - Tipos TypeScript

### Instalación
```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

## 🎯 Próximas Mejoras

### Sugerencias para el Futuro

1. **Plantillas de Email**
   - Editor visual de plantillas
   - Variables dinámicas
   - Previsualización

2. **Cola de Emails**
   - Envío asíncrono
   - Reintentos automáticos
   - Priorización

3. **Estadísticas**
   - Emails enviados/fallidos
   - Tasa de apertura (con tracking)
   - Gráficos de uso

4. **Múltiples Remitentes**
   - Diferentes emails para diferentes tipos
   - Configuración por departamento
   - Alias personalizados

5. **Encriptación de Contraseñas**
   - Encriptar contraseñas SMTP en BD
   - Usar variables de entorno
   - Integración con servicios de secrets

## ✅ Checklist de Implementación

- [x] Agregar configuración SMTP en base de datos
- [x] Crear endpoints backend (get, update, test)
- [x] Instalar nodemailer
- [x] Crear componente EmailConfig
- [x] Agregar sub-pestaña en ConfigurationTab
- [x] Implementar envío de email de prueba
- [x] Agregar guía rápida para Gmail
- [x] Documentar configuración
- [x] Commit y push a GitHub
- [ ] Probar con cuenta real de Gmail
- [ ] Probar con otros proveedores
- [ ] Implementar en producción

## 🎓 Recursos Adicionales

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Office 365 SMTP Settings](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Mailgun SMTP](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)

---

**Implementado por**: Manus AI  
**Fecha**: 22 de octubre de 2025  
**Versión**: 1.0.0

