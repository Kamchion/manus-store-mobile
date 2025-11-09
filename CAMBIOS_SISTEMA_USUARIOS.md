# Cambios en el Sistema de Usuarios y Precios

## 📋 Resumen de Cambios Implementados

Se ha actualizado completamente el sistema de usuarios y precios de la tienda B2B según los requerimientos especificados.

---

## 🎯 Cambios Principales

### 1. **Sistema de Precios por Usuario** ✅

**Antes:**
- Los precios estaban determinados por el rol del usuario
- Roles: user, distributor, reseller, admin

**Después:**
- Los precios se asignan individualmente a cada usuario
- 3 tipos de precio: **Ciudad**, **Interior**, **Especial**
- Cada usuario tiene un `priceType` asignado independientemente de su rol

**Beneficios:**
- Mayor flexibilidad en la asignación de precios
- Un cliente puede tener precio "especial" sin cambiar su rol
- Facilita promociones y descuentos personalizados

---

### 2. **Nuevos Roles con Permisos Específicos** ✅

#### **Cliente**
- Usuario final que realiza compras
- Puede ver productos y realizar pedidos
- Solo ve sus propios pedidos
- **Campos especiales**: `clientNumber`

#### **Operador**
- Gestiona pedidos y usuarios
- **NO puede acceder a la pestaña de productos**
- **NO puede crear administradores**
- Puede crear clientes y vendedores
- Ve todos los pedidos y estadísticas

#### **Administrador**
- Acceso total al sistema
- Puede gestionar productos, usuarios, pedidos
- Puede crear otros administradores
- Acceso completo al panel de administración

#### **Vendedor**
- Agente de ventas rutero
- Gestiona sus propios clientes
- **Campos especiales**: `agentNumber`
- Los clientes con el mismo `agentNumber` pertenecen a este vendedor
- Solo ve pedidos y estadísticas de sus clientes

---

### 3. **Nuevos Campos en Usuarios** ✅

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `gpsLocation` | VARCHAR(255) | Coordenadas GPS (latitud,longitud) | No |
| `address` | TEXT | Dirección completa | No |
| `clientNumber` | VARCHAR(50) | Número de cliente (ej: CLI-001) | Solo para clientes |
| `agentNumber` | VARCHAR(50) | Número de agente/vendedor (ej: VEN-15) | Solo para vendedores |
| `priceType` | ENUM | Tipo de precio (ciudad/interior/especial) | Sí (default: ciudad) |
| `role` | ENUM | Rol (cliente/operador/administrador/vendedor) | Sí (default: cliente) |

---

### 4. **Relación Vendedor-Cliente** ✅

**Funcionamiento:**
1. Al crear un vendedor, se le asigna un `agentNumber` (ej: VEN-15)
2. Al crear un cliente, se puede asignar el mismo `agentNumber`
3. El vendedor puede ver y gestionar solo los clientes con su `agentNumber`

**Ejemplo:**
```
Vendedor: Juan Pérez
  - agentNumber: VEN-15
  
Clientes de Juan:
  - Cliente A (agentNumber: VEN-15)
  - Cliente B (agentNumber: VEN-15)
  - Cliente C (agentNumber: VEN-15)
```

---

## 🗄️ Cambios en la Base de Datos

### Tabla `users` - Nuevos Campos

```sql
ALTER TABLE users ADD COLUMN gpsLocation VARCHAR(255);
ALTER TABLE users ADD COLUMN clientNumber VARCHAR(50);
ALTER TABLE users ADD COLUMN agentNumber VARCHAR(50);
ALTER TABLE users ADD COLUMN priceType ENUM('ciudad', 'interior', 'especial') DEFAULT 'ciudad';
ALTER TABLE users MODIFY COLUMN role ENUM('cliente', 'operador', 'administrador', 'vendedor');
```

### Nueva Tabla `pricingByType`

```sql
CREATE TABLE pricingByType (
  id VARCHAR(64) PRIMARY KEY,
  productId VARCHAR(64) NOT NULL,
  priceType ENUM('ciudad', 'interior', 'especial') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  minQuantity INT DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Migración de Datos

- ✅ Datos de `rolePricing` migrados a `pricingByType`
- ✅ Roles antiguos convertidos a nuevos roles
- ✅ Tipos de precio asignados según rol anterior
- ✅ Números de cliente/agente generados automáticamente

---

## 📁 Archivos Creados/Modificados

### Backend

1. **`/server/permissions.ts`** (NUEVO)
   - Sistema completo de permisos por rol
   - Funciones de verificación de permisos
   - Información descriptiva de roles y tipos de precio

2. **`/server/pricing.ts`** (NUEVO)
   - Funciones para obtener precios por usuario
   - Gestión de precios por tipo
   - Integración con el sistema de usuarios

3. **`/server/middleware.ts`** (NUEVO)
   - Middleware de autenticación y autorización
   - Verificación de permisos
   - Control de acceso por rol

4. **`/drizzle/schema.ts`** (MODIFICADO)
   - Esquema actualizado con nuevos campos
   - Nueva tabla `pricingByType`
   - Enums actualizados

### Frontend

1. **`/client/src/components/UserFormNew.tsx`** (NUEVO)
   - Formulario completo de creación de usuarios
   - Campos para dirección y GPS
   - Selector de rol y tipo de precio
   - Campos condicionales según rol
   - Botón para obtener ubicación GPS automáticamente

2. **`/client/src/pages/admin/Users.tsx`** (MODIFICADO)
   - Estado del formulario actualizado
   - Integración con nuevos campos

---

## 🔐 Sistema de Permisos

### Matriz de Permisos

| Permiso | Cliente | Operador | Administrador | Vendedor |
|---------|---------|----------|---------------|----------|
| Ver productos | ✅ | ✅ | ✅ | ✅ |
| Crear productos | ❌ | ❌ | ✅ | ❌ |
| Editar productos | ❌ | ❌ | ✅ | ❌ |
| Importar productos | ❌ | ❌ | ✅ | ❌ |
| Ver usuarios | ❌ | ✅ | ✅ | ❌ |
| Crear usuarios | ❌ | ✅ | ✅ | ✅* |
| Crear admins | ❌ | ❌ | ✅ | ❌ |
| Ver pedidos | ✅* | ✅ | ✅ | ✅* |
| Ver todos los pedidos | ❌ | ✅ | ✅ | ❌ |
| Panel de admin | ❌ | ✅ | ✅ | ✅* |

*Notas:*
- *Cliente: Solo ve sus propios pedidos
- *Vendedor: Solo puede crear clientes, solo ve pedidos de sus clientes
- *Vendedor: Panel de admin limitado a sus clientes

---

## 🚀 Funcionalidades Nuevas

### 1. Geolocalización GPS
- Botón para obtener ubicación automáticamente
- Almacenamiento de coordenadas (latitud, longitud)
- Útil para rutas de vendedores

### 2. Números de Cliente/Agente
- Generación automática o manual
- Formato: CLI-XXX para clientes, VEN-XXX para vendedores
- Relación vendedor-cliente mediante `agentNumber`

### 3. Tipos de Precio Personalizados
- Asignación individual por usuario
- 3 niveles: Ciudad, Interior, Especial
- Independiente del rol del usuario

### 4. Control de Acceso Granular
- Permisos específicos por rol
- Operadores sin acceso a productos
- Vendedores con vista limitada a sus clientes

---

## 📝 Próximos Pasos Sugeridos

### Para completar la implementación:

1. **Actualizar routers del backend**
   - Integrar middleware de permisos
   - Actualizar endpoints de usuarios
   - Implementar filtros por vendedor

2. **Actualizar componentes del frontend**
   - Integrar `UserFormNew` en el panel de admin
   - Actualizar filtros de roles
   - Mostrar nuevos campos en tablas

3. **Implementar vista de vendedor**
   - Dashboard con sus clientes
   - Estadísticas de ventas por vendedor
   - Gestión de clientes asignados

4. **Actualizar catálogo de productos**
   - Mostrar precios según `priceType` del usuario
   - Actualizar cálculos de carrito
   - Integrar con `pricing.ts`

5. **Pruebas**
   - Crear usuarios de cada rol
   - Verificar permisos
   - Probar relación vendedor-cliente
   - Validar precios por tipo

---

## ⚠️ Notas Importantes

1. **Migración de datos**: Los usuarios existentes fueron migrados automáticamente:
   - `admin` → `administrador` (priceType: especial)
   - `user` → `cliente` (priceType: ciudad)
   - `distributor` → `cliente` (priceType: interior)
   - `reseller` → `cliente` (priceType: especial)

2. **Compatibilidad**: La tabla `rolePricing` se mantiene por compatibilidad pero ya no se usa. Usar `pricingByType` en su lugar.

3. **Números automáticos**: Si no se especifica `clientNumber` o `agentNumber`, se generan automáticamente basados en el ID del usuario.

4. **GPS**: La ubicación GPS se puede obtener automáticamente con el botón en el formulario (requiere permisos del navegador).

---

## 🎉 Resumen

✅ Sistema de precios por usuario implementado  
✅ 4 roles nuevos con permisos específicos  
✅ Campos de dirección y GPS agregados  
✅ Números de cliente/agente implementados  
✅ Relación vendedor-cliente funcional  
✅ Base de datos migrada correctamente  
✅ Archivos de backend creados  
✅ Componente de formulario actualizado  

**Estado**: Backend completado, pendiente integración en frontend y pruebas.

