# Problema Identificado: Precios por Rol No Se Aplican

## Descripción del Problema

Al iniciar sesión con diferentes roles (Usuario, Distribuidor, Revendedor), los precios mostrados en el catálogo de productos son siempre los mismos (precio base), cuando deberían ser diferentes según el rol del usuario.

## Causa Raíz

En el archivo `/home/ubuntu/client/src/pages/Products.tsx`, línea 17:

```typescript
const { data: products = [], isLoading } = trpc.products.list.useQuery();
```

El componente está usando el endpoint `products.list` que retorna todos los productos con su `basePrice`, sin considerar el rol del usuario autenticado.

En la línea 196:
```typescript
<p className="text-lg md:text-xl font-bold text-blue-600 mb-2">
  ${parseFloat(product.basePrice || "0").toFixed(2)}
</p>
```

Se muestra directamente el `basePrice` sin aplicar el precio específico del rol.

## Solución Disponible

Existe un endpoint en el backend llamado `getWithPricing` (línea 79 del archivo `/home/ubuntu/server/routers.ts`) que:

1. Obtiene el producto
2. Consulta el precio específico para el rol del usuario (`getPriceForRole`)
3. Obtiene la cantidad mínima para ese rol (`getMinimumQuantity`)

Sin embargo, este endpoint solo funciona para UN producto a la vez (requiere `id` como parámetro).

## Opciones de Solución

### Opción 1: Crear un nuevo endpoint `listWithPricing`
Crear un endpoint similar a `list` pero que incluya los precios por rol para cada producto.

**Ventajas:**
- Una sola llamada al backend
- Mejor rendimiento
- Más eficiente

**Desventajas:**
- Requiere modificar el backend

### Opción 2: Usar `getWithPricing` para cada producto
Hacer múltiples llamadas al endpoint `getWithPricing` para cada producto.

**Ventajas:**
- No requiere cambios en el backend
- Usa endpoints existentes

**Desventajas:**
- Múltiples llamadas al backend (6 productos = 6 llamadas)
- Peor rendimiento
- Más complejo en el frontend

### Opción 3: Calcular precios en el frontend
Obtener la tabla `rolePricing` completa y calcular los precios en el cliente.

**Ventajas:**
- Flexibilidad en el frontend

**Desventajas:**
- Expone la estructura de precios completa al cliente
- Problema de seguridad potencial
- Lógica de negocio en el frontend

## Recomendación

**Opción 1** es la mejor solución. Crear un endpoint `products.listWithPricing` que:
1. Obtenga todos los productos
2. Para cada producto, obtenga el precio del rol del usuario autenticado
3. Para cada producto, obtenga la cantidad mínima del rol
4. Retorne los productos con esta información adicional

## Estado Actual de la Base de Datos

La tabla `rolePricing` ya contiene los precios diferenciados por rol (según el script de seed). El problema es solo en el frontend que no está consultando estos precios.

## Impacto

- **Funcionalidad afectada:** Catálogo de productos
- **Usuarios afectados:** Todos los roles (distribuidor, revendedor)
- **Severidad:** Media-Alta (funcionalidad core de B2B no funciona)
- **Workaround:** Ninguno disponible para el usuario final

