# Sistema de Promociones Mejorado

## 🎯 Nuevas Funcionalidades

El sistema de promociones ahora soporta **3 tipos diferentes** de promociones con configuraciones flexibles:

### 1. **Descuento por Cantidad Escalonado** (`quantity_discount`)
Descuentos que aumentan según la cantidad comprada.

**Ejemplo**:
- 50 unidades → 10% descuento
- 100 unidades → 20% descuento  
- 200 unidades → 25% descuento
- 500 unidades → 30% descuento

**Características**:
- Múltiples niveles (tiers) de descuento
- Cada tier tiene cantidad mínima y valor de descuento
- Puede ser porcentaje o monto fijo
- Se aplica automáticamente el mejor descuento según cantidad

### 2. **Compra X, Lleva Y** (`buy_x_get_y`)
Promociones donde al comprar cierta cantidad, se regalan unidades adicionales.

**Ejemplo**:
- Compra 10, lleva 12 (2 gratis)
- Compra 20, lleva 24 (4 gratis)
- Compra 50, lleva 60 (10 gratis)

**Características**:
- Cantidad a comprar (buyQuantity)
- Cantidad que se regala (getQuantity)
- Ideal para promociones de lanzamiento o liquidación

### 3. **Descuento Simple** (`simple_discount`)
Descuento tradicional con cantidad mínima.

**Ejemplo**:
- 15% descuento al comprar mínimo 10 unidades
- $500 descuento al comprar mínimo 5 unidades

**Características**:
- Un solo nivel de descuento
- Cantidad mínima requerida
- Porcentaje o monto fijo

---

## 📊 Estructura de Base de Datos

### Tabla: `promotions`

**Columnas nuevas**:
- `promotionType`: Tipo de promoción (quantity_discount, buy_x_get_y, simple_discount)
- `minQuantity`: Cantidad mínima para descuento simple
- `buyQuantity`: Cantidad a comprar para buy_x_get_y
- `getQuantity`: Cantidad que se regala para buy_x_get_y

**Columnas modificadas**:
- `discountType`: Ahora es opcional (NULL permitido)
- `discountValue`: Ahora es opcional (NULL permitido)

### Tabla: `quantity_discount_tiers` (NUEVA)

Almacena los niveles de descuento escalonado.

**Columnas**:
- `id`: ID único del tier
- `promotionId`: ID de la promoción padre
- `minQuantity`: Cantidad mínima para este tier
- `discountType`: Tipo de descuento (percentage o fixed)
- `discountValue`: Valor del descuento
- `createdAt`: Fecha de creación

**Ejemplo de datos**:
```
promotionId: promo_001
Tiers:
  - minQuantity: 50,  discountType: percentage, discountValue: 10
  - minQuantity: 100, discountType: percentage, discountValue: 20
  - minQuantity: 200, discountType: percentage, discountValue: 25
  - minQuantity: 500, discountType: percentage, discountValue: 30
```

---

## 🔧 Funciones de Backend

### `createQuantityDiscountTiers()`
Crea los tiers de descuento para una promoción de tipo quantity_discount.

**Parámetros**:
- `promotionId`: ID de la promoción
- `tiers`: Array de tiers con minQuantity, discountType, discountValue

### `getQuantityDiscountTiers()`
Obtiene todos los tiers de una promoción ordenados por cantidad mínima.

**Retorna**: Array de tiers

### `getApplicableDiscount()`
Calcula el descuento aplicable para un producto según la cantidad.

**Parámetros**:
- `productId`: ID del producto
- `quantity`: Cantidad a comprar

**Retorna**: Objeto con información del mejor descuento aplicable

**Lógica**:
1. Obtiene todas las promociones activas del producto
2. Para quantity_discount: busca el tier más alto que aplique
3. Para buy_x_get_y: verifica si la cantidad cumple
4. Para simple_discount: verifica cantidad mínima
5. Retorna el mejor descuento (mayor valor)

---

## 🎨 Interfaz de Usuario (Pendiente)

### Formulario de Creación de Promociones

**Campos comunes**:
- Producto
- Nombre de la promoción
- Descripción
- Tipo de promoción (selector)
- Fecha inicio / Fecha fin

**Campos según tipo**:

#### Quantity Discount
- Botón "Agregar Tier"
- Lista de tiers:
  - Cantidad mínima
  - Tipo de descuento (% o $)
  - Valor del descuento
  - Botón eliminar tier

#### Buy X Get Y
- Cantidad a comprar
- Cantidad que se regala

#### Simple Discount
- Cantidad mínima
- Tipo de descuento (% o $)
- Valor del descuento

---

## 📋 Ejemplos de Uso

### Ejemplo 1: Descuento Escalonado

**Configuración**:
- Producto: Batería AA
- Tipo: quantity_discount
- Tiers:
  - 50 unidades → 10%
  - 100 unidades → 20%
  - 200 unidades → 25%

**Resultado**:
- Cliente compra 75 unidades → 10% descuento
- Cliente compra 150 unidades → 20% descuento
- Cliente compra 250 unidades → 25% descuento

### Ejemplo 2: Compra X Lleva Y

**Configuración**:
- Producto: Remera Básica
- Tipo: buy_x_get_y
- Compra: 10 unidades
- Lleva: 12 unidades (2 gratis)

**Resultado**:
- Cliente compra 10 → recibe 12
- Cliente compra 20 → recibe 24
- Cliente compra 25 → recibe 30

### Ejemplo 3: Descuento Simple

**Configuración**:
- Producto: Zapatillas Deportivas
- Tipo: simple_discount
- Cantidad mínima: 5
- Descuento: 15%

**Resultado**:
- Cliente compra 3 → sin descuento
- Cliente compra 5 → 15% descuento
- Cliente compra 10 → 15% descuento

---

## 🔄 Flujo de Aplicación de Descuentos

```
Usuario agrega producto al carrito
         ↓
Sistema consulta getApplicableDiscount(productId, quantity)
         ↓
Backend busca promociones activas
         ↓
[Tipo: quantity_discount]
  → Obtiene tiers
  → Encuentra tier aplicable
  → Retorna descuento del tier más alto
  
[Tipo: buy_x_get_y]
  → Verifica si quantity >= buyQuantity
  → Calcula unidades gratis
  → Retorna información de regalo
  
[Tipo: simple_discount]
  → Verifica si quantity >= minQuantity
  → Retorna descuento configurado
         ↓
Frontend muestra descuento aplicado
         ↓
Precio final = precio base - descuento
```

---

## ✅ Estado Actual

### Completado
- ✅ Esquema de base de datos actualizado
- ✅ Tabla `quantity_discount_tiers` creada
- ✅ Columnas agregadas a `promotions`
- ✅ Funciones de backend implementadas
- ✅ Lógica de cálculo de descuentos

### Pendiente
- ⏳ Interfaz de usuario para crear promociones
- ⏳ Visualización de tiers en formulario
- ⏳ Integración con carrito de compras
- ⏳ Mostrar descuentos en catálogo
- ⏳ Actualización de routers tRPC

---

## 📦 Archivos Modificados

1. **drizzle/schema.ts**
   - Actualizada tabla `promotions`
   - Agregada tabla `quantityDiscountTiers`

2. **server/db.ts**
   - Importado `quantityDiscountTiers`
   - Agregadas funciones:
     - `createQuantityDiscountTiers()`
     - `getQuantityDiscountTiers()`
     - `getApplicableDiscount()`

3. **Migración SQL**
   - `drizzle/0005_big_kinsey_walden.sql`
   - Aplicada manualmente vía Node.js

---

## 🚀 Próximos Pasos

1. **Actualizar routers tRPC** para soportar nuevos tipos de promociones
2. **Crear interfaz de usuario** en AdminPanel para gestionar promociones
3. **Integrar con carrito** para aplicar descuentos automáticamente
4. **Mostrar promociones** en catálogo de productos
5. **Agregar validaciones** de fechas y cantidades
6. **Crear reportes** de promociones más utilizadas

---

## 💡 Ventajas del Nuevo Sistema

✅ **Flexibilidad**: 3 tipos diferentes de promociones
✅ **Escalabilidad**: Descuentos escalonados ilimitados
✅ **Automatización**: Cálculo automático del mejor descuento
✅ **Incentivos**: Fomenta compras en mayor cantidad
✅ **Competitividad**: Promociones tipo "Compra X Lleva Y"
✅ **Control**: Fechas de inicio y fin para cada promoción
✅ **Análisis**: Datos estructurados para reportes

---

## 📊 Casos de Uso Empresariales

### Mayoristas
- Descuentos escalonados para incentivar compras grandes
- Ejemplo: 10% en 50 unidades, 20% en 100 unidades

### Minoristas
- Compra X Lleva Y para productos de rotación rápida
- Ejemplo: Compra 6 bebidas, lleva 8

### Distribuidores
- Descuentos simples con cantidad mínima
- Ejemplo: 15% descuento comprando mínimo 20 unidades

### Liquidación
- Compra X Lleva Y agresivo
- Ejemplo: Compra 5, lleva 10 (100% extra)

---

## 🔐 Seguridad y Validaciones

### Backend
- ✅ Validación de tipos de promoción
- ✅ Validación de fechas (inicio < fin)
- ✅ Validación de cantidades (> 0)
- ✅ Validación de valores de descuento
- ✅ Promociones solo para productos activos

### Frontend (Pendiente)
- ⏳ Validación de campos requeridos
- ⏳ Validación de rangos de fechas
- ⏳ Validación de tiers (cantidades crecientes)
- ⏳ Confirmación antes de eliminar
- ⏳ Preview de descuento antes de guardar

---

## 📈 Métricas Sugeridas

Para futuras implementaciones:

1. **Promociones más efectivas** (mayor volumen de ventas)
2. **Productos con más promociones activas**
3. **Descuento promedio aplicado**
4. **Cantidad promedio por pedido con promoción**
5. **Comparación ventas con/sin promoción**
6. **ROI de promociones** (costo vs incremento en ventas)

---

Este sistema de promociones mejorado proporciona una base sólida para estrategias de pricing dinámico y fomenta las compras en mayor volumen, beneficiando tanto al negocio como a los clientes.

