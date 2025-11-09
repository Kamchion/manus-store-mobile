# Sistema de Configuración Expandido

## Resumen

Se ha expandido el panel de configuración del sistema para incluir configuraciones críticas que antes estaban hardcodeadas en el código. Ahora el administrador puede configurar dinámicamente la tasa de impuesto, moneda, zona horaria y otros parámetros del sistema desde el panel de administración.

## Cambios Implementados

### 1. Base de Datos

Se agregaron las siguientes claves de configuración a la tabla `systemConfig`:

- **tax_rate**: Tasa de impuesto en porcentaje (default: 10)
- **timezone**: Zona horaria del sistema (default: America/Asuncion)
- **currency**: Código de moneda (default: USD)
- **currency_symbol**: Símbolo de moneda (default: $)
- **store_name**: Nombre de la tienda (default: IMPORKAM)
- **store_phone**: Teléfono de contacto
- **store_address**: Dirección de la tienda

**Script SQL**: `add_new_system_settings.sql`

### 2. Backend (server/routers.ts)

#### Endpoint de Actualización Expandido

El endpoint `config.update` ahora acepta los siguientes parámetros adicionales:

```typescript
{
  taxRate?: string,
  timezone?: string,
  currency?: string,
  currencySymbol?: string,
  storeName?: string,
  storePhone?: string,
  storeAddress?: string
}
```

#### Cálculo Dinámico de Impuestos

El cálculo de impuestos en el checkout ahora obtiene la tasa desde la configuración:

```typescript
// Antes (hardcodeado)
const tax = subtotal * 0.1;

// Ahora (dinámico)
const taxRateConfig = await db
  .select()
  .from(systemConfig)
  .where(eq(systemConfig.key, "tax_rate"))
  .limit(1);

const taxRatePercent = taxRateConfig[0]?.value ? parseFloat(taxRateConfig[0].value) : 10;
const tax = subtotal * (taxRatePercent / 100);
```

### 3. Frontend

#### Hook Personalizado: useSystemConfig

Se creó un hook centralizado para acceder a la configuración del sistema:

**Ubicación**: `client/src/_core/hooks/useSystemConfig.ts`

**Funcionalidades**:

- `config`: Objeto con todas las configuraciones del sistema
- `formatPrice(price)`: Formatea precios con el símbolo de moneda configurado
- `calculateTax(subtotal)`: Calcula impuestos basado en la tasa configurada
- `calculateTotal(subtotal)`: Calcula el total (subtotal + impuesto)

**Ejemplo de uso**:

```typescript
const { config, formatPrice, calculateTax } = useSystemConfig();

// Formatear precio
<span>{formatPrice(product.price)}</span> // Muestra: $10.00

// Calcular impuesto
const tax = calculateTax(subtotal);

// Mostrar tasa de impuesto
<span>Impuesto ({config.taxRate}%)</span> // Muestra: Impuesto (10%)
```

#### Componentes Actualizados

Los siguientes componentes ahora usan el hook `useSystemConfig`:

1. **Cart.tsx**
   - Formateo dinámico de precios
   - Cálculo de impuestos con tasa configurable
   - Muestra el porcentaje de impuesto correcto

2. **Orders.tsx**
   - Formateo de precios en lista de pedidos

3. **OrderDetail.tsx**
   - Formateo de precios en detalles del pedido
   - Muestra porcentaje de impuesto correcto

4. **Products.tsx**
   - Formateo de precios en catálogo de productos

### 4. Panel de Configuración (SystemConfig.tsx)

El panel de configuración ya tenía la interfaz preparada con todos los campos necesarios. Se organizó en secciones:

#### Configuración de Emails
- Email de envío (FROM)
- Emails de destino para pedidos (TO)

#### Pop-up de Anuncios
- Activar/desactivar pop-up
- Título y mensaje del anuncio
- Vista previa del pop-up

#### Configuración General
- Nombre de la tienda
- Teléfono de contacto
- Dirección de la tienda

#### Configuración Financiera
- **Tasa de Impuesto**: Campo numérico con rango 0-100%
- **Moneda**: Selector con opciones:
  - USD (Dólar Estadounidense)
  - PYG (Guaraní Paraguayo)
  - EUR (Euro)
  - BRL (Real Brasileño)
  - ARS (Peso Argentino)
- **Símbolo de Moneda**: Campo de texto (máx. 3 caracteres)
- **Zona Horaria**: Selector con zonas de América Latina:
  - America/Asuncion (Paraguay)
  - America/Buenos_Aires (Argentina)
  - America/Sao_Paulo (Brasil)
  - America/Santiago (Chile)
  - America/Montevideo (Uruguay)
  - Y más...

## Beneficios

### 1. Flexibilidad
- No requiere cambios en el código para ajustar impuestos o moneda
- Adaptable a diferentes mercados y regulaciones fiscales

### 2. Centralización
- Todas las configuraciones en un solo lugar
- Fácil mantenimiento y auditoría

### 3. Consistencia
- El hook `useSystemConfig` garantiza que todos los componentes usen los mismos valores
- Formateo uniforme de precios en toda la aplicación

### 4. Escalabilidad
- Fácil agregar nuevas configuraciones siguiendo el mismo patrón
- Sistema preparado para internacionalización

## Uso para Administradores

### Cambiar la Tasa de Impuesto

1. Ir a **Panel de Administración** → **Configuración**
2. En la sección **Configuración Financiera**, modificar el campo **Tasa de Impuesto (%)**
3. Hacer clic en **Guardar Configuración**
4. Los nuevos pedidos usarán la tasa actualizada automáticamente

### Cambiar la Moneda

1. Ir a **Panel de Administración** → **Configuración**
2. En la sección **Configuración Financiera**:
   - Seleccionar la **Moneda** deseada
   - Ajustar el **Símbolo de Moneda** si es necesario
3. Hacer clic en **Guardar Configuración**
4. Todos los precios se mostrarán con el nuevo símbolo inmediatamente

### Configurar Zona Horaria

1. Ir a **Panel de Administración** → **Configuración**
2. En la sección **Configuración Financiera**, seleccionar la **Zona Horaria**
3. Hacer clic en **Guardar Configuración**
4. Las fechas de pedidos se mostrarán en la zona horaria seleccionada

## Notas Técnicas

### Valores por Defecto

Si no se puede obtener la configuración del servidor, el hook usa estos valores por defecto:

```typescript
{
  taxRate: 10,
  timezone: "America/Asuncion",
  currency: "USD",
  currencySymbol: "$",
  storeName: "IMPORKAM",
  storePhone: "",
  storeAddress: ""
}
```

### Permisos

Solo los usuarios con rol **administrador** pueden:
- Ver la configuración del sistema
- Actualizar la configuración del sistema

### Auditoría

Todos los cambios en la configuración se registran en la tabla `auditLogs` con:
- Usuario que realizó el cambio
- Acción: `CONFIG_UPDATED`
- Detalles de los valores modificados

## Próximos Pasos Sugeridos

1. **Aplicar Zona Horaria**: Usar la configuración de timezone para formatear fechas en pedidos y reportes
2. **Formato de Moneda Regional**: Implementar formateo de números según la moneda seleccionada (ej: separadores de miles)
3. **Múltiples Impuestos**: Permitir configurar diferentes tasas de impuesto por región o tipo de producto
4. **Exportación de Configuración**: Permitir exportar/importar configuraciones para respaldo

## Commit

**Hash**: 4fa3d6d
**Mensaje**: feat: Sistema de configuración expandido con tasa de impuesto, moneda y zona horaria

**Archivos modificados**:
- `client/src/pages/Cart.tsx`
- `client/src/pages/OrderDetail.tsx`
- `client/src/pages/Orders.tsx`
- `client/src/pages/Products.tsx`
- `client/src/pages/admin/SystemConfig.tsx`
- `server/routers.ts`

**Archivos nuevos**:
- `client/src/_core/hooks/useSystemConfig.ts`

