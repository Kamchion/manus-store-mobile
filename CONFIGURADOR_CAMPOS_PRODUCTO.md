# Configurador Visual de Campos de Producto

## Resumen

Se ha implementado un configurador visual e interactivo que permite a los administradores personalizar qué campos se muestran en las tarjetas de productos del catálogo y en qué orden aparecen, todo desde una interfaz intuitiva con funcionalidad de arrastrar y soltar (drag & drop).

## Características Principales

### 1. Interfaz Drag & Drop

El configurador permite reordenar campos simplemente arrastrándolos a la posición deseada. La interfaz es intuitiva y responde en tiempo real a los cambios.

### 2. Activar/Desactivar Campos

Cada campo puede ser activado o desactivado con un simple switch. Los campos desactivados no se muestran en las tarjetas de producto pero permanecen disponibles para activarse en cualquier momento.

### 3. Vista Previa en Tiempo Real

Un panel lateral muestra cómo se verá la tarjeta de producto con la configuración actual, permitiendo visualizar los cambios antes de guardarlos.

### 4. Configuración Persistente

La configuración se guarda en la base de datos y se aplica automáticamente a todas las tarjetas de producto en el catálogo.

## Campos Disponibles

El sistema incluye 13 campos configurables:

| Campo | Etiqueta | Tipo de Visualización | Descripción |
|-------|----------|----------------------|-------------|
| `name` | Nombre | text | Nombre del producto |
| `sku` | SKU | badge | Código SKU del producto |
| `description` | Descripción | multiline | Descripción del producto (máx 2 líneas) |
| `category` | Categoría | badge | Categoría del producto |
| `rolePrice` | Precio | price | Precio según rol del usuario |
| `stock` | Stock | number | Stock disponible |
| `variantName` | Variante | text | Nombre de la variante |
| `dimension` | Dimensiones | text | Dimensiones del producto |
| `line1Text` | Línea 1 | text | Texto personalizado línea 1 |
| `line2Text` | Línea 2 | text | Texto personalizado línea 2 |
| `minQuantity` | Cantidad Mínima | number | Cantidad mínima de compra |
| `location` | Ubicación | text | Ubicación en almacén |
| `unitsPerBox` | Unidades/Caja | number | Unidades por caja |

## Configuración por Defecto

Al instalar el sistema, los siguientes campos están activos:

1. **Nombre** (text)
2. **Precio** (price)
3. **Stock** (number)

Los demás campos están disponibles pero desactivados por defecto.

## Cómo Usar

### Acceder al Configurador

1. Iniciar sesión como **administrador**
2. Ir a **Panel de Administración**
3. Hacer clic en la pestaña **Campos de Producto**

### Reordenar Campos

1. En la sección **Campos Activos**, hacer clic y mantener presionado el ícono de líneas (≡) junto a un campo
2. Arrastrar el campo a la posición deseada
3. Soltar para colocar el campo en su nueva posición
4. El orden se actualiza automáticamente en la vista previa

### Activar/Desactivar Campos

**Para activar un campo:**
1. Buscar el campo en la sección **Campos Disponibles**
2. Hacer clic en el switch para activarlo
3. El campo aparecerá en la sección **Campos Activos**
4. Arrastrarlo a la posición deseada

**Para desactivar un campo:**
1. Buscar el campo en la sección **Campos Activos**
2. Hacer clic en el switch para desactivarlo
3. El campo se moverá a la sección **Campos Disponibles**

### Guardar Configuración

1. Realizar todos los cambios deseados
2. Hacer clic en el botón **Guardar Configuración** en la parte inferior
3. Los cambios se aplicarán inmediatamente a todas las tarjetas de producto

## Arquitectura Técnica

### Base de Datos

La configuración se almacena en la tabla `systemConfig` con la clave `product_card_fields`:

```json
{
  "key": "product_card_fields",
  "value": "[
    {
      \"field\": \"name\",
      \"label\": \"Nombre\",
      \"enabled\": true,
      \"order\": 1,
      \"displayType\": \"text\"
    },
    ...
  ]"
}
```

### Backend (server/routers.ts)

**Endpoint para obtener configuración:**
```typescript
config.getProductFields: protectedProcedure.query()
```

**Endpoint para guardar configuración:**
```typescript
config.updateProductFields: protectedProcedure
  .input(z.array(z.object({
    field: z.string(),
    label: z.string(),
    enabled: z.boolean(),
    order: z.number(),
    displayType: z.string()
  })))
  .mutation()
```

### Frontend

**Componentes creados:**

1. **ProductFieldsConfig.tsx** - Configurador principal con drag & drop
   - Ubicación: `client/src/pages/admin/ProductFieldsConfig.tsx`
   - Usa `@dnd-kit` para funcionalidad drag & drop
   - Incluye vista previa en tiempo real
   - Gestiona estado de campos activos/inactivos

2. **ProductCard.tsx** - Tarjeta de producto dinámica
   - Ubicación: `client/src/components/ProductCard.tsx`
   - Renderiza campos según configuración
   - Maneja diferentes tipos de visualización
   - Mantiene funcionalidad de agregar al carrito

3. **useProductFields.ts** - Hook personalizado
   - Ubicación: `client/src/_core/hooks/useProductFields.ts`
   - Obtiene configuración de campos
   - Filtra solo campos activos
   - Ordena según configuración

### Tipos de Visualización

El sistema soporta 5 tipos de visualización:

1. **text** - Texto simple
2. **badge** - Etiqueta pequeña con fondo gris
3. **price** - Formato de precio con símbolo de moneda
4. **number** - Número con formato especial (ej: stock)
5. **multiline** - Texto en múltiples líneas (máx 2)

## Dependencias Agregadas

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

Estas bibliotecas proporcionan la funcionalidad de drag & drop de manera accesible y performante.

## Flujo de Datos

```
┌─────────────────────────────────────┐
│   Configurador (Admin)              │
│   - Activar/desactivar campos       │
│   - Reordenar con drag & drop       │
│   - Vista previa                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Backend API                       │
│   - config.updateProductFields      │
│   - Validación                      │
│   - Guardado en DB                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Base de Datos (systemConfig)      │
│   - key: product_card_fields        │
│   - value: JSON con configuración   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Hook useProductFields             │
│   - Obtiene configuración           │
│   - Filtra campos activos           │
│   - Ordena por order                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   ProductCard Component             │
│   - Renderiza campos dinámicamente  │
│   - Aplica estilos según tipo       │
│   - Mantiene funcionalidad          │
└─────────────────────────────────────┘
```

## Ventajas

### 1. Flexibilidad Total

Cada cliente puede personalizar completamente la visualización de productos según sus necesidades específicas sin modificar código.

### 2. Sin Necesidad de Desarrollador

Los cambios se realizan desde una interfaz visual intuitiva, eliminando la necesidad de conocimientos técnicos.

### 3. Vista Previa Instantánea

Los cambios se visualizan en tiempo real antes de guardar, evitando sorpresas desagradables.

### 4. Configuración Persistente

La configuración se guarda en base de datos y se aplica automáticamente en toda la aplicación.

### 5. Escalable

Fácil agregar nuevos campos en el futuro siguiendo el mismo patrón.

## Casos de Uso

### Caso 1: Tienda Enfocada en Precio

**Configuración recomendada:**
1. Nombre
2. Precio
3. SKU
4. Stock

### Caso 2: Tienda con Variantes Complejas

**Configuración recomendada:**
1. Nombre
2. Variante
3. Dimensiones
4. Precio
5. Unidades por Caja

### Caso 3: Tienda con Ubicaciones

**Configuración recomendada:**
1. Nombre
2. SKU
3. Ubicación
4. Stock
5. Precio

### Caso 4: Tienda con Información Personalizada

**Configuración recomendada:**
1. Nombre
2. Línea 1 (ej: "¡Oferta!")
3. Línea 2 (ej: "Envío gratis")
4. Precio
5. Cantidad Mínima

## Mantenimiento

### Agregar un Nuevo Campo

Para agregar un nuevo campo al sistema:

1. **Actualizar la configuración en base de datos:**
   ```sql
   UPDATE systemConfig 
   SET value = JSON_ARRAY_APPEND(value, '$', JSON_OBJECT(
     'field', 'nuevo_campo',
     'label', 'Nuevo Campo',
     'enabled', false,
     'order', 14,
     'displayType', 'text'
   ))
   WHERE `key` = 'product_card_fields';
   ```

2. **Actualizar ProductCard.tsx** para manejar el renderizado del nuevo campo si requiere lógica especial.

3. **Documentar** el nuevo campo en esta guía.

### Modificar Tipos de Visualización

Los tipos de visualización están definidos en `ProductCard.tsx` en la función `renderFieldValue()`. Para agregar un nuevo tipo:

1. Agregar el tipo al enum `displayType`
2. Agregar un nuevo case en el switch de `renderFieldValue()`
3. Implementar el renderizado correspondiente

## Limitaciones Conocidas

1. **Campos Requeridos**: Algunos campos como "nombre" y "precio" son esenciales para la funcionalidad del catálogo. Aunque se pueden desactivar, no es recomendable.

2. **Caché del Cliente**: Los cambios pueden tardar hasta 5 minutos en reflejarse en clientes que ya tienen la página cargada debido al caché de tRPC.

3. **Campos Personalizados**: Actualmente solo se pueden configurar los 13 campos predefinidos. Agregar campos completamente nuevos requiere modificación de código.

## Próximas Mejoras Sugeridas

1. **Plantillas Predefinidas**: Crear plantillas de configuración para diferentes tipos de tienda.

2. **Configuración por Categoría**: Permitir diferentes configuraciones de campos según la categoría del producto.

3. **Campos Condicionales**: Mostrar ciertos campos solo si cumplen condiciones (ej: mostrar "Oferta" solo si hay promoción).

4. **Estilos Personalizados**: Permitir personalizar colores, tamaños y estilos de cada campo.

5. **Exportar/Importar Configuración**: Facilitar el respaldo y migración de configuraciones.

## Solución de Problemas

### Los cambios no se reflejan en el catálogo

**Solución**: Refrescar la página del catálogo (F5) para forzar la recarga de la configuración.

### El drag & drop no funciona

**Solución**: Verificar que las dependencias `@dnd-kit` estén instaladas correctamente:
```bash
pnpm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Error al guardar configuración

**Solución**: Verificar que el usuario tenga rol de "administrador" y que la conexión a la base de datos esté activa.

### Vista previa no coincide con el catálogo

**Solución**: La vista previa usa datos de ejemplo. Verificar en el catálogo real para ver el resultado final.

## Commit

**Hash**: 1a16fd2  
**Mensaje**: feat: Configurador visual de campos de producto con drag & drop

**Archivos modificados**: 8  
**Líneas agregadas**: +752  
**Líneas eliminadas**: -118

**Archivos clave**:
- `client/src/pages/admin/ProductFieldsConfig.tsx` (nuevo)
- `client/src/components/ProductCard.tsx` (nuevo)
- `client/src/_core/hooks/useProductFields.ts` (nuevo)
- `client/src/pages/Products.tsx` (modificado)
- `client/src/pages/AdminPanel.tsx` (modificado)
- `server/routers.ts` (modificado)
- `package.json` (modificado)

## Conclusión

El configurador visual de campos de producto proporciona una herramienta poderosa y flexible para personalizar la visualización del catálogo sin necesidad de conocimientos técnicos. Su interfaz intuitiva con drag & drop y vista previa en tiempo real hace que la configuración sea rápida y segura.

---

**Proyecto**: IMPORKAM Tienda B2B  
**Versión**: 1.1.0 (con configurador de campos)  
**Último Commit**: 1a16fd2  
**Fecha**: 22 de Octubre, 2025

