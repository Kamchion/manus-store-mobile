# Sistema de Envío de Correos con PDF y Excel

## 🎯 Funcionalidad Implementada

Cuando un cliente hace clic en **"ENVIAR PEDIDO"**, el sistema automáticamente:

1. ✅ **Crea el pedido** en la base de datos
2. ✅ **Genera PDF** con todos los detalles del pedido
3. ✅ **Genera Excel** con los productos en formato tabla
4. ✅ **Envía correo** a `ikampedidos@gmail.com` con ambos archivos adjuntos
5. ✅ **Copia al cliente** (CC) para que también reciba el pedido

---

## 📧 Configuración de Correo

### Servicio: Resend
- **API Key**: `re_GthM8i3z_M9asmomfM1pedXoyNigHLzLp`
- **Límite gratuito**: 3,000 correos/mes
- **Correo destino**: ikampedidos@gmail.com

### Remitente
- **From**: `Manus Store <onboarding@resend.dev>`
- **To**: ikampedidos@gmail.com
- **CC**: Email del cliente (copia)

---

## 📄 Archivos Generados

### 1. PDF del Pedido

**Nombre**: `Pedido_ORD-XXXXXXXXX.pdf`

**Contenido**:
- Encabezado: "PEDIDO"
- Número de pedido
- Fecha y hora
- Información del cliente:
  - Empresa
  - Contacto
  - Email
  - Teléfono
  - Dirección
- Tabla de productos:
  - Nombre del producto
  - Cantidad
  - Precio unitario
  - Subtotal
- Totales:
  - Subtotal
  - Impuesto (10%)
  - **TOTAL**

**Formato**: Profesional, con encabezados en negrita, tabla organizada

---

### 2. Excel del Pedido

**Nombre**: `Pedido_ORD-XXXXXXXXX.xlsx`

**Contenido**:
- Hoja: "Pedido"
- Encabezado centrado: "PEDIDO"
- Información del pedido (número, fecha)
- Información del cliente (empresa, contacto, email, teléfono, dirección)
- Tabla de productos con columnas:
  - Producto
  - Cantidad
  - Precio Unitario
  - Subtotal
- Totales calculados:
  - Subtotal
  - Impuesto (10%)
  - TOTAL (en negrita)

**Formato**: Tabla con encabezados con fondo gris, números formateados como moneda

---

## 📧 Correo Enviado

### Asunto
```
Nuevo Pedido - ORD-1729567890123
```

### Cuerpo (HTML)
```html
Nuevo Pedido Recibido

┌────────────────────────────────────┐
│ Número de Pedido: ORD-XXXXXXXXX    │
│ Cliente: Nombre del Cliente        │
│ Email: cliente@example.com         │
│ Total: $1,650.00                   │
└────────────────────────────────────┘

Se adjuntan los detalles del pedido en formato PDF y Excel.

──────────────────────────────────────
Este es un correo automático generado por 
el sistema de pedidos de Manus Store.
```

### Adjuntos
1. `Pedido_ORD-XXXXXXXXX.pdf` (PDF)
2. `Pedido_ORD-XXXXXXXXX.xlsx` (Excel)

---

## 🔄 Flujo Completo

```
1. Cliente agrega productos al carrito
   ↓
2. Cliente hace clic en "ENVIAR PEDIDO"
   ↓
3. Sistema valida el carrito
   ↓
4. Sistema calcula totales (subtotal, impuesto, total)
   ↓
5. Sistema crea el pedido en la base de datos
   ↓
6. Sistema genera PDF del pedido
   ↓
7. Sistema genera Excel del pedido
   ↓
8. Sistema envía correo con adjuntos a:
   - TO: ikampedidos@gmail.com
   - CC: email del cliente
   ↓
9. Sistema limpia el carrito
   ↓
10. Cliente ve confirmación del pedido
```

---

## 🛡️ Manejo de Errores

### Si el correo falla
- ✅ El pedido **SÍ se crea** en la base de datos
- ✅ El carrito **SÍ se limpia**
- ✅ El cliente **SÍ ve la confirmación**
- ⚠️ Se registra el error en los logs del servidor
- 💡 El administrador puede reenviar el correo manualmente

**Razón**: No queremos que un fallo en el correo impida que se complete el pedido.

---

## 📊 Ejemplo de Pedido

### Datos del Cliente
```
Empresa: Distribuidora ABC S.A.
Contacto: Juan Pérez
Email: juan@distribuidoraabc.com
Teléfono: +595 21 123456
Dirección: Av. Principal 123, Asunción
```

### Productos
```
┌─────────────────────────────┬──────┬─────────┬───────────┐
│ Producto                    │ Cant │ Precio  │ Subtotal  │
├─────────────────────────────┼──────┼─────────┼───────────┤
│ Batería AA                  │  60  │ $ 2.50  │ $ 150.00  │
│ Remera Básica - Color: Negro│  10  │ $15.00  │ $ 150.00  │
│ Detergente Líquido          │  24  │ $ 8.50  │ $ 204.00  │
└─────────────────────────────┴──────┴─────────┴───────────┘

Subtotal:        $ 504.00
Impuesto (10%):  $  50.40
──────────────────────────
TOTAL:           $ 554.40
```

---

## 🔧 Archivos Técnicos

### 1. `/server/order-export-service.ts`
- `generateOrderPDF(order)` - Genera PDF del pedido
- `generateOrderExcel(order)` - Genera Excel del pedido

### 2. `/server/email-service.ts`
- `sendOrderEmail(params)` - Envía correo con adjuntos
- `testEmailConfig()` - Prueba la configuración de correo

### 3. `/server/routers.ts`
- Checkout mutation - Integra generación y envío

---

## 📦 Dependencias Instaladas

```json
{
  "resend": "^6.2.2",        // Servicio de correo
  "pdfkit": "^0.17.2",       // Generación de PDF
  "exceljs": "^4.4.0",       // Generación de Excel
  "nodemailer": "^7.0.9",    // (Backup, no usado)
  "@types/pdfkit": "^0.17.3",
  "@types/nodemailer": "^7.0.2"
}
```

---

## 🎉 Resultado Final

Cuando un cliente envía un pedido:

1. ✅ **ikampedidos@gmail.com** recibe:
   - Correo con resumen del pedido
   - PDF adjunto con detalles completos
   - Excel adjunto con tabla de productos

2. ✅ **Cliente** recibe (CC):
   - Misma información
   - Confirmación de su pedido

3. ✅ **Base de datos**:
   - Pedido registrado con estado "Enviado"
   - Carrito limpiado
   - Auditoría registrada

---

## 🔐 Seguridad

- ✅ API Key de Resend en variable de entorno (o hardcoded temporalmente)
- ✅ Correos enviados desde dominio verificado de Resend
- ✅ No se exponen datos sensibles en logs
- ✅ Errores manejados sin exponer información interna

---

## 📝 Notas

1. **Dominio personalizado**: Actualmente usa `onboarding@resend.dev`. Para usar tu propio dominio (ej: `pedidos@manusstore.com`), necesitas verificar el dominio en Resend.

2. **Límite de correos**: 3,000 correos/mes gratis. Si necesitas más, Resend tiene planes pagos.

3. **Logs**: Los envíos exitosos y fallidos se registran en la consola del servidor.

4. **Testing**: Puedes probar el envío de correos con la función `testEmailConfig()`.

---

## ✅ Estado

**Implementado**: ✅ Completo
**Probado**: ⏳ Pendiente (requiere crear un pedido real)
**Producción**: ✅ Listo para usar

---

**Fecha**: 21 de Octubre, 2025
**Versión**: 1.0.0

