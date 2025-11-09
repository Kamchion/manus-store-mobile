# Guía Rápida - Tienda B2B

## 🚀 Inicio Rápido

### 1. Requisitos Previos
- Node.js 22.x
- MySQL 8.x
- pnpm (gestor de paquetes)

### 2. Instalación

```bash
# Descomprimir el proyecto
unzip b2b_store_actualizado.zip
cd b2b_store

# Instalar dependencias
pnpm install

# Configurar base de datos
# Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE b2b_store;
exit;

# Ejecutar migraciones
DATABASE_URL="mysql://root:tu_password@localhost:3306/b2b_store" pnpm drizzle-kit push

# Poblar con datos de ejemplo (opcional)
DATABASE_URL="mysql://root:tu_password@localhost:3306/b2b_store" pnpm tsx scripts/seed.ts
```

### 3. Configuración

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="mysql://root:tu_password@localhost:3306/b2b_store"

# JWT Secret (cambiar en producción)
JWT_SECRET="tu_secreto_super_seguro_cambiar_en_produccion"

# Puerto del servidor
PORT=3000
```

### 4. Iniciar el Servidor

```bash
# Modo desarrollo
pnpm dev

# El servidor estará disponible en http://localhost:3000
```

---

## 👥 Usuarios de Prueba

Acceder a `/dev-login` para iniciar sesión con:

| Usuario | Rol | Email |
|---------|-----|-------|
| Juan Pérez | Usuario | usuario@ejemplo.com |
| María García | Distribuidor | distribuidor@ejemplo.com |
| Carlos López | Revendedor | reseller@ejemplo.com |
| Admin Usuario | Administrador | admin@tienda.com |

---

## 📁 Estructura del Proyecto

```
b2b_store/
├── client/          # Frontend React + TypeScript
├── server/          # Backend Express + tRPC
├── drizzle/         # ORM y esquema de base de datos
├── scripts/         # Scripts de utilidad (seed, etc.)
├── shared/          # Código compartido entre frontend y backend
└── package.json     # Dependencias del proyecto
```

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo

# Base de datos
pnpm db:push          # Aplicar cambios de esquema a la BD
pnpm db:studio        # Abrir Drizzle Studio (GUI para BD)
pnpm db:seed          # Poblar BD con datos de ejemplo

# Build
pnpm build            # Compilar para producción
pnpm start            # Iniciar servidor de producción

# Linting y formateo
pnpm lint             # Ejecutar linter
pnpm format           # Formatear código
```

---

## 🎯 Funcionalidades Principales

### Para Usuarios
1. **Catálogo de Productos**: Ver productos con precios según su rol
2. **Carrito de Compras**: Agregar productos y gestionar cantidades
3. **Checkout**: Crear órdenes de compra
4. **Mis Pedidos**: Ver historial de órdenes

### Para Administradores
1. **Gestión de Productos**: CRUD completo de productos
2. **Precios por Rol**: Configurar precios diferenciados
3. **Promociones**: Crear y gestionar descuentos
4. **Pedidos**: Ver y gestionar todas las órdenes
5. **Importar/Exportar**: Excel para productos

---

## 🔐 Seguridad

⚠️ **IMPORTANTE PARA PRODUCCIÓN:**

1. Cambiar `JWT_SECRET` en `.env`
2. Configurar OAuth real (eliminar dev-login)
3. Configurar HTTPS
4. Configurar CORS apropiadamente
5. Validar todas las entradas de usuario
6. Implementar rate limiting

---

## 📊 Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `products` - Catálogo de productos
- `rolePricing` - Precios por rol
- `minimumQuantities` - Cantidades mínimas por rol
- `cart` - Carrito de compras
- `orders` - Órdenes de compra
- `orderItems` - Items de las órdenes
- `promotions` - Promociones y descuentos
- `productPromotions` - Relación productos-promociones
- `auditLog` - Registro de auditoría

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"
- Verificar que MySQL esté corriendo
- Verificar credenciales en `DATABASE_URL`
- Verificar que la base de datos existe

### Error: "Port 3000 already in use"
- Cambiar puerto en `.env`
- O detener el proceso usando el puerto: `lsof -ti:3000 | xargs kill`

### Error: "Module not found"
- Ejecutar `pnpm install` nuevamente
- Limpiar caché: `pnpm store prune`

### Los precios no cambian según el rol
- Verificar que el usuario esté autenticado
- Verificar que existan precios configurados en `rolePricing`
- Verificar que se esté usando `products.listWithPricing` en el frontend

---

## 📞 Soporte

Para más información, revisar:
- `INFORME_FINAL_TIENDA_B2B.md` - Documentación completa
- `README.md` - Documentación del proyecto original
- `problema_precios_rol.md` - Análisis del problema de precios (resuelto)

---

## 🚀 Próximos Pasos

1. Revisar `INFORME_FINAL_TIENDA_B2B.md` para ver funcionalidades pendientes
2. Probar todas las funcionalidades con diferentes roles
3. Configurar sistema de pagos (Stripe/PayPal/MercadoPago)
4. Implementar autenticación real
5. Configurar emails de notificación
6. Preparar para despliegue en producción

---

**¡Listo para usar!** 🎉

La aplicación está completamente funcional para desarrollo y pruebas. Para producción, seguir las recomendaciones de seguridad y completar las funcionalidades pendientes listadas en el informe final.

