# 📊 Formato de Importación Excel - Sistema Actualizado

## 🎯 Estructura del Excel

El sistema ahora soporta importación de productos con **18 columnas (A-R)** con la siguiente estructura:

| Columna | Nombre Campo | Descripción | Obligatorio | Ejemplo |
|---------|--------------|-------------|-------------|---------|
| **A** | orden | Orden de aparición en el catálogo | No | A0001 |
| **B** | Categoría principal | Categoría del producto | Sí | BATERIA |
| **C** | subcategoria | Subcategoría del producto | No | TIENDA |
| **D** | Código del modelo | SKU del producto padre (para variantes) | No | PROD-MADRE-001 |
| **E** | Codigo del articulo | SKU único del producto | **Sí** | F002103 |
| **F** | Descripcion | Nombre del producto | **Sí** | BATERIA ALKALINA TROEN D 2pcs |
| **G** | Descripción del modelo | Nombre de la variante | No | Rojo |
| **H** | Dimensión 1 | Dimensión del variante (color, tamaño, etc.) | No | Grande |
| **I** | linea1 | Texto arriba del cuadro de cantidad | No | Pedido mínimo |
| **J** | Cantidad minima | Cantidad mínima para pedido | No | 12 |
| **K** | linea2 | Texto en rojo debajo del nombre | No | ¡Oferta! |
| **L** | ItemUPC | Ubicación del producto | No | A-15-B |
| **M** | cant*cja | Unidades por caja sellada | No | 96 |
| **N** | Ocultar en catalogo | FALSE=ocultar, TRUE=mostrar | No | FALSE |
| **O** | STOCK | Cantidad en inventario | Sí | 172 |
| **P** | ciudad | Precio para tipo Ciudad | **Sí** | 2.38 |
| **Q** | interior | Precio para tipo Interior | **Sí** | 2.5 |
| **R** | especial | Precio para tipo Especial | **Sí** | 2.6656 |

---

## 🔄 Sistema de Variantes

### Producto Padre (Madre)
- El **Código del modelo** (columna D) define el SKU del producto padre
- Todos los productos con el mismo código de modelo son variantes del mismo producto

### Ejemplo:
```
| Código Modelo | SKU      | Descripción          | Variante | Dimensión |
|---------------|----------|----------------------|----------|-----------|
| CAMISA-001    | CAM-R-M  | Camisa Polo          | Roja     | Mediana   |
| CAMISA-001    | CAM-R-L  | Camisa Polo          | Roja     | Grande    |
| CAMISA-001    | CAM-A-M  | Camisa Polo          | Azul     | Mediana   |
```

---

## 💰 Sistema de Precios por Tipo

Cada producto tiene **3 precios** según el tipo de usuario:

1. **Ciudad** (columna P) - Para usuarios con `priceType = "ciudad"`
2. **Interior** (columna Q) - Para usuarios con `priceType = "interior"`
3. **Especial** (columna R) - Para usuarios con `priceType = "especial"`

El sistema muestra automáticamente el precio correcto según el tipo asignado al usuario.

---

## 📋 Campos Especiales

### Campo "Ocultar en catalogo" (Columna N)
- **FALSE** = El producto SE OCULTA del catálogo
- **TRUE** = El producto SE MUESTRA en el catálogo
- Por defecto: TRUE (se muestra)

### Campo "linea1" (Columna I)
- Texto que aparece **arriba del cuadro de cantidad**
- Útil para indicaciones como "Pedido mínimo", "Solo mayoreo", etc.

### Campo "linea2" (Columna K)
- Texto que aparece **debajo del nombre del producto en ROJO**
- Útil para promociones, alertas, ofertas especiales

### Campo "Cantidad minima" (Columna J)
- Define la cantidad mínima que se puede pedir
- Si está vacío, por defecto es 1

---

## 🎨 Visualización en el Catálogo

Con los nuevos campos, cada producto se mostrará así:

```
┌─────────────────────────────────────┐
│  [Imagen del Producto]              │
│                                     │
│  BATERIA ALKALINA TROEN D 2pcs     │
│  ¡Oferta especial!  ← linea2 (rojo)│
│                                     │
│  SKU: F002103                       │
│  Categoría: BATERIA > TIENDA        │
│  Ubicación: A-15-B                  │
│  Unidades por caja: 96              │
│                                     │
│  Pedido mínimo ← linea1             │
│  Cantidad: [12] ← minQuantity       │
│                                     │
│  Precio: $2.38                      │
│  [Agregar al Carrito]               │
└─────────────────────────────────────┘
```

---

## ✅ Validaciones

El sistema valida:

1. ✅ **SKU único** - No puede haber dos productos con el mismo SKU
2. ✅ **Campos obligatorios** - SKU, Descripción, Stock, Precios
3. ✅ **Formato de precios** - Deben ser números válidos
4. ✅ **Stock** - Debe ser un número entero

---

## 📤 Proceso de Importación

### 1. Preparar Excel
- Usar la plantilla con las 18 columnas
- Llenar los datos según el formato
- Guardar como `.xlsx`

### 2. Importar en el Sistema
1. Ir al **Panel Admin** > **Importar**
2. Seleccionar el archivo Excel
3. (Opcional) Subir imágenes asociadas
4. Click en **"Importar Productos"**

### 3. Resultado
El sistema mostrará:
- ✅ Productos creados
- ✅ Productos actualizados
- ❌ Errores (si los hay)

---

## 🔄 Actualización de Productos

Si un producto con el mismo SKU ya existe:
- Se **ACTUALIZA** con los nuevos datos
- Se mantiene el ID del producto
- Se actualizan los precios por tipo

---

## 📊 Ejemplo Completo

```excel
A     | B        | C      | D    | E       | F                              | G    | H    | I    | J  | K | L | M  | N     | O   | P    | Q    | R
------|----------|--------|------|---------|--------------------------------|------|------|------|----|----|---|-------|-------|-----|------|------|------
A0001 | BATERIA  | TIENDA |      | F002103 | BATERIA ALKALINA TROEN D 2pcs  |      |      |      |    |   |   | 96 | FALSE | 172 | 2.38 | 2.5  | 2.67
A0002 | BATERIA  | TIENDA |      | F002102 | BATERIA ALKALINA TROEN AAA 12  |      |      |      | 12 |   |   | 240| FALSE | 20  | 8.25 | 8.65 | 9.24
```

---

## 🎯 Ventajas del Nuevo Sistema

1. ✅ **Importación masiva** - Cientos de productos en segundos
2. ✅ **Variantes automáticas** - Productos con múltiples opciones
3. ✅ **Precios diferenciados** - 3 tipos de precio por producto
4. ✅ **Campos personalizados** - linea1, linea2, ubicación, etc.
5. ✅ **Control de visibilidad** - Ocultar productos sin eliminarlos
6. ✅ **Orden personalizado** - Controlar el orden en el catálogo
7. ✅ **Actualización fácil** - Reimportar para actualizar

---

## 📝 Notas Importantes

- Los productos con `hideInCatalog = TRUE` (columna N = FALSE) **NO aparecen** en el catálogo público
- El campo `orden` (columna A) determina el orden de aparición en el catálogo
- Los precios se aplican automáticamente según el `priceType` del usuario
- Las imágenes se asocian por SKU (nombre de archivo = SKU del producto)

---

## 🚀 Estado Actual

✅ **Base de datos actualizada** - Todos los campos agregados  
✅ **Esquema Drizzle actualizado** - Tipos TypeScript correctos  
✅ **Servicio de importación creado** - Procesa las 18 columnas  
⏳ **Pendiente** - Actualizar endpoint HTTP y UI  

---

**Fecha de actualización**: 21 de Octubre, 2025  
**Versión**: 3.0.0

