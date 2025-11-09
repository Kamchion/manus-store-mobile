# Tienda B2B Imporkam

Sistema completo de comercio electrónico B2B con gestión de productos, usuarios, precios por rol y sistema de pedidos.

## 🚀 Características Principales

### Sistema Multi-Rol
- **Administrador**: Gestión completa del sistema, productos, usuarios y configuración
- **Operador**: Gestión de productos y pedidos
- **Vendedor**: Interfaz dedicada con gestión de clientes y pedidos
- **Cliente**: Compra de productos con precios personalizados
- **Distribuidor**: Acceso a precios especiales de distribuidor

### Interfaz de Vendedor
- **Pedidos**: Selección/creación de clientes y acceso al catálogo
- **Clientes**: Gestión completa de cartera (CRUD)
- **Dashboard**: Estadísticas y métricas de rendimiento
- **Historial**: Listado de pedidos mensuales con detalles

### Gestión de Productos
- Importación masiva desde Excel
- Múltiples imágenes por producto
- Precios diferenciados por rol
- Categorías y búsqueda avanzada
- Gestión de stock y disponibilidad

### Sistema de Pedidos
- Carrito de compras intuitivo
- Precios según rol del usuario
- Historial de pedidos
- Estados de pedido (pendiente, procesando, completado)
- Exportación a Excel

## 📦 Tecnologías

- **Frontend**: React 19 + Vite + TailwindCSS + Radix UI
- **Backend**: Node.js + Express + tRPC 11
- **Base de Datos**: MySQL (TiDB Cloud)
- **ORM**: Drizzle
- **Autenticación**: JWT + Manus OAuth
- **Enrutamiento**: Wouter
- **Notificaciones**: Sonner

## 🛠️ Instalación

### Prerrequisitos
- Node.js 22.x o superior
- MySQL 8.0 o superior (o TiDB Cloud)
- pnpm (recomendado) o npm

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd tienda-b2b
```

2. **Instalar dependencias**
```bash
pnpm install
# o
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL=mysql://usuario:password@host:puerto/database

# Autenticación
JWT_SECRET=tu-secreto-jwt-muy-seguro
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# Configuración de la aplicación
VITE_APP_ID=tu-app-id
VITE_APP_TITLE=Tienda B2B Imporkam
VITE_APP_LOGO=/assets/imporkam-logo.png
OWNER_OPEN_ID=tu-open-id
OWNER_NAME=Tu Nombre

# APIs integradas (opcional)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=tu-api-key

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=tu-website-id
```

4. **Importar base de datos**

```bash
# Importar el backup incluido
mysql -h host -P puerto -u usuario -p database < database_backup.sql
```

5. **Ejecutar migraciones (si es necesario)**

```bash
pnpm db:push
```

6. **Iniciar servidor de desarrollo**

```bash
pnpm dev
```

El servidor estará disponible en `http://localhost:3000` (o el puerto disponible).

## 📊 Estructura de la Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema con roles
- **products**: Catálogo de productos
- **product_images**: Imágenes de productos
- **categories**: Categorías de productos
- **cart_items**: Items del carrito
- **orders**: Pedidos realizados
- **order_items**: Detalles de los pedidos
- **product_fields_config**: Configuración de campos visibles
- **system_config**: Configuración general del sistema

### Campos Importantes

**users**:
- `role`: admin, operador, vendedor, cliente, distribuidor
- `agentNumber`: Número de agente (para vendedores)
- `clientNumber`: Número de cliente (formato CLI-XXXXXX)
- `priceType`: Tipo de precio asignado

**products**:
- Precios diferenciados: `priceCliente`, `priceDistribuidor`, `priceVendedor`
- `stock`: Inventario disponible
- `minQuantity`: Cantidad mínima de compra

## 🔐 Usuarios de Prueba

Después de importar la base de datos, tendrás acceso a usuarios de prueba (verifica el archivo SQL para credenciales específicas).

## 📝 Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Inicia servidor de desarrollo

# Base de datos
pnpm db:push      # Sincroniza esquema con la base de datos
pnpm db:studio    # Abre Drizzle Studio para gestión visual

# Producción
pnpm build        # Compila el proyecto
pnpm start        # Inicia servidor de producción

# Utilidades
pnpm typecheck    # Verifica tipos de TypeScript
pnpm lint         # Ejecuta linter
```

## 🎨 Personalización

### Logo y Branding
- Actualiza `/client/public/assets/imporkam-logo.png` con tu logo
- Modifica `VITE_APP_TITLE` en `.env` para el título
- Configura colores en `client/src/index.css`

### Campos de Producto
- Accede al Panel Admin → Configuración → Campos de Producto
- Activa/desactiva campos según tus necesidades
- Los cambios se reflejan inmediatamente en el catálogo

## 📱 Características Responsive

La aplicación está completamente optimizada para:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## 🔄 Flujo de Trabajo del Vendedor

1. **Login** como vendedor
2. **Seleccionar sección**:
   - Pedidos → Elegir/crear cliente → Acceder al catálogo
   - Clientes → Gestionar cartera completa
   - Dashboard → Ver estadísticas
   - Historial → Revisar pedidos del mes

3. **Crear pedido**:
   - Seleccionar cliente existente o crear nuevo
   - Navegar al catálogo
   - Agregar productos al carrito
   - Finalizar pedido

## 🐛 Solución de Problemas

### El servidor no inicia
- Verifica que el puerto 3000 esté disponible
- Revisa la conexión a la base de datos en `.env`
- Ejecuta `pnpm install` nuevamente

### Errores de base de datos
- Verifica que las credenciales en `DATABASE_URL` sean correctas
- Asegúrate de haber importado el backup SQL
- Ejecuta `pnpm db:push` para sincronizar el esquema

### Problemas de autenticación
- Verifica que `JWT_SECRET` esté configurado
- Revisa las URLs de OAuth
- Limpia cookies del navegador

## 📄 Licencia

Este proyecto es privado y propietario de Imporkam.

## 👥 Soporte

Para soporte técnico, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025

