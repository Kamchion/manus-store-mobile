# Panel de Configuración del Sistema - IMPORKAM

**Fecha:** 22 de octubre de 2025  
**Commit:** `d0a634a`

---

## Resumen

Se ha implementado un **Panel de Configuración del Sistema** en el área de administración que permite:

1. **Configurar emails** para notificaciones de pedidos
2. **Gestionar pop-ups de anuncios** que se muestran al login de clientes

---

## Características Implementadas

### 1. Configuración de Emails

El administrador puede configurar:

- **Email de Envío (FROM):** El email que aparecerá como remitente en las notificaciones
  - Por defecto: `chjulio79@gmail.com`
  
- **Emails de Destino (TO):** Lista de emails que recibirán las notificaciones de pedidos
  - Por defecto: `ikampedidos@gmail.com`, `ikamcorreo@gmail.com`
  - Soporta múltiples emails separados por comas

### 2. Pop-up de Anuncios al Login

El administrador puede:

- **Activar/Desactivar** el pop-up
- **Configurar el título** del anuncio
- **Escribir el mensaje** personalizado
- **Ver una vista previa** del pop-up antes de guardarlo

**Comportamiento del Pop-up:**
- Se muestra automáticamente cuando el usuario inicia sesión
- Solo se muestra **una vez por sesión** (usando sessionStorage)
- Aparece después de 500ms del login para mejor UX
- El usuario puede cerrarlo haciendo clic en el botón "Cerrar"

---

## Estructura Técnica

### Base de Datos

**Tabla:** `systemConfig`

```sql
CREATE TABLE systemConfig (
  id VARCHAR(64) PRIMARY KEY,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updatedBy VARCHAR(64)
);
```

**Configuraciones por defecto:**

| Key | Value | Descripción |
|-----|-------|-------------|
| `email_from` | `chjulio79@gmail.com` | Email remitente |
| `email_to_orders` | `["ikampedidos@gmail.com", "ikamcorreo@gmail.com"]` | Emails destino (JSON array) |
| `popup_enabled` | `false` | Activar/desactivar pop-up |
| `popup_title` | `¡Bienvenido!` | Título del pop-up |
| `popup_message` | `Tenemos nuevos productos disponibles.` | Mensaje del pop-up |

### Rutas tRPC

**Ubicación:** `server/routers.ts`

#### `config.getAll` (Protegido - Solo Admin)
Obtiene toda la configuración del sistema.

```typescript
const config = await trpc.config.getAll.useQuery();
// Retorna: { email_from: "...", email_to_orders: "...", ... }
```

#### `config.update` (Protegido - Solo Admin)
Actualiza la configuración del sistema.

```typescript
await trpc.config.update.mutate({
  emailFrom: "pedidos@imporkam.com",
  emailToOrders: ["email1@example.com", "email2@example.com"],
  popupEnabled: true,
  popupTitle: "¡Nuevos Productos!",
  popupMessage: "Revisa nuestro catálogo actualizado...",
});
```

#### `config.getPopup` (Público)
Obtiene la configuración del pop-up para mostrarlo en el login.

```typescript
const popup = await trpc.config.getPopup.useQuery();
// Retorna: { enabled: true, title: "...", message: "..." }
```

### Componentes Frontend

#### 1. `SystemConfig.tsx`
**Ubicación:** `client/src/pages/admin/SystemConfig.tsx`

Página de configuración en el panel de administración.

**Características:**
- Formulario para configurar emails
- Switch para activar/desactivar pop-up
- Campos para título y mensaje del pop-up
- Vista previa en tiempo real del pop-up
- Validación de emails
- Mensajes de éxito/error con Sonner

#### 2. `AnnouncementPopup.tsx`
**Ubicación:** `client/src/components/AnnouncementPopup.tsx`

Componente que muestra el pop-up de anuncios.

**Características:**
- Se muestra automáticamente al login
- Solo una vez por sesión (sessionStorage)
- Delay de 500ms para mejor UX
- Dialog modal con shadcn/ui
- Botón de cierre

#### 3. `AdminPanel.tsx` (Modificado)
Se agregó un nuevo tab "Configuración" que solo es visible para administradores.

```tsx
{user?.role === "administrador" && (
  <Button
    variant={activeTab === "config" ? "default" : "outline"}
    onClick={() => setActiveTab("config")}
  >
    <Settings className="w-4 h-4" />
    Configuración
  </Button>
)}
```

#### 4. `App.tsx` (Modificado)
Se agregó el componente `AnnouncementPopup` para que se muestre cuando el usuario esté autenticado.

```tsx
{isAuthenticated && <AnnouncementPopup />}
```

---

## Cómo Usar

### Para Administradores

1. **Acceder al Panel de Configuración:**
   - Iniciar sesión como administrador
   - Ir a "Panel Admin"
   - Hacer clic en el tab "Configuración"

2. **Configurar Emails:**
   - Ingresar el email de envío (FROM)
   - Ingresar los emails de destino separados por comas
   - Hacer clic en "Guardar Configuración"

3. **Configurar Pop-up de Anuncios:**
   - Activar el switch "Activar Pop-up"
   - Ingresar el título del anuncio
   - Escribir el mensaje (soporta múltiples líneas)
   - Ver la vista previa
   - Hacer clic en "Guardar Configuración"

### Para Clientes

Cuando el pop-up está activado:
1. El cliente inicia sesión
2. Después de 500ms, aparece el pop-up con el mensaje
3. El cliente lee el mensaje
4. Cierra el pop-up haciendo clic en "Cerrar"
5. El pop-up no se volverá a mostrar en esa sesión

---

## Archivos Modificados

```
client/src/
├── App.tsx                              # Agregado AnnouncementPopup
├── components/
│   └── AnnouncementPopup.tsx           # NUEVO - Componente del pop-up
├── pages/
│   ├── AdminPanel.tsx                  # Agregado tab de configuración
│   └── admin/
│       └── SystemConfig.tsx            # NUEVO - Página de configuración

server/
└── routers.ts                          # Agregado router config

drizzle/
└── schema.ts                           # Agregada tabla systemConfig

create_systemconfig.sql                 # Script SQL para crear tabla
```

---

## Seguridad

- ✅ **Solo administradores** pueden acceder al panel de configuración
- ✅ **Validación de emails** en el frontend
- ✅ **Protección de rutas** con `protectedProcedure` en tRPC
- ✅ **Auditoría** de cambios con `logAudit()`
- ✅ **Registro del usuario** que hace cambios (`updatedBy`)

---

## Mejoras Futuras

### Posibles Extensiones

1. **Editor de Texto Rico:**
   - Usar un editor WYSIWYG para el mensaje del pop-up
   - Soportar formato HTML, negritas, enlaces, etc.

2. **Múltiples Pop-ups:**
   - Crear varios pop-ups con diferentes mensajes
   - Programar fechas de inicio y fin
   - Dirigir pop-ups a roles específicos

3. **Plantillas de Email:**
   - Configurar plantillas HTML para emails
   - Personalizar el diseño de las notificaciones
   - Agregar logo de la empresa

4. **Configuraciones Adicionales:**
   - Configurar horarios de atención
   - Mensajes de mantenimiento
   - Términos y condiciones
   - Políticas de privacidad

5. **Notificaciones Push:**
   - Integrar notificaciones push del navegador
   - Alertas de nuevos productos
   - Recordatorios de carritos abandonados

---

## Pruebas

### Probar Configuración de Emails

1. Ir a Panel Admin > Configuración
2. Cambiar el email FROM
3. Agregar/quitar emails TO
4. Guardar
5. Verificar que se guarde correctamente
6. Hacer un pedido de prueba
7. Verificar que los emails se envíen a las direcciones configuradas

### Probar Pop-up de Anuncios

1. Ir a Panel Admin > Configuración
2. Activar el pop-up
3. Escribir un mensaje de prueba
4. Guardar
5. Cerrar sesión
6. Iniciar sesión nuevamente
7. Verificar que aparezca el pop-up
8. Cerrar el pop-up
9. Navegar por la aplicación
10. Verificar que no vuelva a aparecer en la misma sesión
11. Abrir en otra pestaña o navegador
12. Verificar que aparezca nuevamente

---

## Soporte

Para cualquier problema o pregunta sobre el panel de configuración:

1. Revisar los logs del servidor: `/tmp/server.log`
2. Verificar la tabla `systemConfig` en la base de datos
3. Revisar la consola del navegador para errores de frontend
4. Verificar que el usuario tenga rol de "administrador"

---

## Changelog

### v1.0.0 - 22 de octubre de 2025

**Agregado:**
- ✅ Tabla `systemConfig` en la base de datos
- ✅ Rutas tRPC para gestionar configuración
- ✅ Página de configuración en panel admin
- ✅ Componente de pop-up de anuncios
- ✅ Integración con App.tsx
- ✅ Validación de emails
- ✅ Vista previa del pop-up
- ✅ Auditoría de cambios

**Commit:** `d0a634a` - Agregar panel de configuración del sistema: emails y pop-ups de anuncios

---

**Desarrollado por:** Manus AI  
**Cliente:** IMPORKAM  
**Proyecto:** Tienda B2B

