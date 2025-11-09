# Configurador Avanzado con Estilos y Layout Personalizable

## Resumen

Se ha expandido el configurador de campos de producto para incluir controles avanzados de diseño que permiten personalizar completamente la apariencia de las tarjetas de producto, incluyendo layout en columnas, colores, tamaños de fuente, márgenes y espaciado.

## Nuevas Características

### 1. Layout en Columnas

Cada campo puede configurarse para ocupar:

- **Ancho Completo (full)** - El campo ocupa toda la fila
- **Columna Izquierda (left)** - El campo se posiciona en la columna izquierda
- **Columna Derecha (right)** - El campo se posiciona en la columna derecha

Esto permite crear layouts como el ejemplo proporcionado:
```
NOMBRE (full width)
SKU | UNIDADES POR CAJA (2 columnas)
STOCK | UBICACIÓN (2 columnas)
```

### 2. Estilos por Campo

Cada campo individual puede personalizarse con:

#### Color de Texto
- Selector de color visual (color picker)
- Input de código hexadecimal (#000000)
- Cualquier color HTML válido

#### Tamaño de Fuente
- Rango: 8px a 32px
- Control numérico preciso
- Vista previa en tiempo real

#### Peso de Fuente
- **400** - Normal
- **500** - Medium
- **600** - Semibold
- **700** - Bold

#### Alineación de Texto
- **Izquierda** - Para campos informativos
- **Centro** - Para títulos y precios
- **Derecha** - Para datos numéricos

### 3. Estilos de Tarjeta

Configuración global de la tarjeta:

#### Márgenes
- **Superior** - Espacio arriba del contenido
- **Inferior** - Espacio abajo del contenido
- **Lateral** - Espacio izquierdo y derecho (simétrico)

#### Espaciado
- **Imagen-Contenido** - Separación entre imagen y primer campo
- **Entre Campos** - Separación vertical entre campos

## Configuración por Defecto

### Campos con Estilos Predefinidos

| Campo | Columna | Color | Tamaño | Peso | Alineación |
|-------|---------|-------|--------|------|------------|
| Nombre | Full | #000000 | 14px | 600 | Centro |
| Precio | Full | #2563eb | 18px | 700 | Centro |
| Stock | Left | #16a34a | 11px | 500 | Izquierda |
| SKU | Left | #6b7280 | 11px | 400 | Izquierda |
| Unidades/Caja | Right | #6b7280 | 11px | 400 | Derecha |
| Ubicación | Right | #6b7280 | 11px | 400 | Derecha |
| Línea 2 | Full | #dc2626 | 11px | 600 | Centro |

### Estilos de Tarjeta por Defecto

- **Margen Superior**: 6px
- **Margen Inferior**: 8px
- **Margen Lateral**: 6px
- **Espacio Imagen-Contenido**: 16px
- **Espacio Entre Campos**: 4px

## Cómo Usar

### Acceder a los Controles de Estilo

1. Ir a **Panel de Administración → Campos de Producto**
2. Hacer clic en el botón **"Mostrar Estilos"** (ícono de paleta)
3. Los controles de estilo aparecerán debajo de cada campo activo

### Configurar Layout en Columnas

**Para crear un layout de 2 columnas:**

1. Seleccionar el primer campo (ej: "SKU")
2. En "Columna", seleccionar **"Izquierda"**
3. Seleccionar el segundo campo (ej: "Unidades por Caja")
4. En "Columna", seleccionar **"Derecha"**
5. Los dos campos aparecerán lado a lado en la vista previa

**Para un campo de ancho completo:**
- Seleccionar **"Ancho completo"** en "Columna"
- El campo ocupará toda la fila

### Personalizar Colores

**Método 1: Color Picker**
1. Hacer clic en el cuadro de color
2. Seleccionar el color deseado en el selector
3. El cambio se refleja inmediatamente en la vista previa

**Método 2: Código Hexadecimal**
1. Escribir el código de color en el input (ej: #ff0000)
2. Presionar Enter
3. El color se actualiza en la vista previa

**Colores Recomendados:**
- Negro: #000000
- Azul (precio): #2563eb
- Verde (stock): #16a34a
- Rojo (promoción): #dc2626
- Gris (info): #6b7280

### Ajustar Tamaños de Fuente

1. Usar el input numérico junto a "Tamaño"
2. Ingresar un valor entre 8 y 32
3. Recomendaciones:
   - **Título (Nombre)**: 14-16px
   - **Precio**: 18-20px
   - **Información**: 11-12px
   - **Detalles**: 10-11px

### Configurar Márgenes y Espaciado

1. Ir a la sección **"Estilos de Tarjeta"** en la parte superior
2. Ajustar cada valor según necesidad:
   - **Márgenes pequeños** (4-6px): Tarjetas compactas
   - **Márgenes medianos** (6-8px): Balance (por defecto)
   - **Márgenes grandes** (10-12px): Tarjetas espaciosas
3. **Espacio Imagen-Contenido**: Controla la separación visual
4. **Espacio Entre Campos**: Afecta la densidad de información

### Guardar Configuración

1. Realizar todos los cambios deseados
2. Verificar en la **Vista Previa** que todo se vea correcto
3. Hacer clic en **"Guardar Configuración"**
4. Los cambios se aplican inmediatamente en el catálogo

## Ejemplos de Configuración

### Ejemplo 1: Layout del Excel Proporcionado

```
┌─────────────────────────┐
│        IMAGEN           │
├─────────────────────────┤
│        NOMBRE           │ (full, center, 14px, bold)
├─────────────────────────┤
│   SKU   │ UNIDADES/CAJA │ (left | right, 11px)
├─────────────────────────┤
│  STOCK  │   UBICACIÓN   │ (left | right, 11px)
├─────────────────────────┤
│   [AGREGAR CARRITO]     │
└─────────────────────────┘
```

**Configuración:**
1. Nombre: full, center, #000000, 14px, 600
2. SKU: left, left, #6b7280, 11px, 400
3. Unidades/Caja: right, right, #6b7280, 11px, 400
4. Stock: left, left, #16a34a, 11px, 500
5. Ubicación: right, right, #6b7280, 11px, 400

### Ejemplo 2: Enfoque en Precio

```
┌─────────────────────────┐
│        IMAGEN           │
├─────────────────────────┤
│        NOMBRE           │ (full, center, 16px, bold)
├─────────────────────────┤
│      Gs. 125.000        │ (full, center, 20px, bold, blue)
├─────────────────────────┤
│    150 disponibles      │ (full, center, 12px, green)
├─────────────────────────┤
│   [AGREGAR CARRITO]     │
└─────────────────────────┘
```

**Configuración:**
1. Nombre: full, center, #000000, 16px, 600
2. Precio: full, center, #2563eb, 20px, 700
3. Stock: full, center, #16a34a, 12px, 500

### Ejemplo 3: Información Detallada

```
┌─────────────────────────┐
│        IMAGEN           │
├─────────────────────────┤
│        NOMBRE           │ (full, center)
├─────────────────────────┤
│    SKU: PROD-001        │ (full, left)
├─────────────────────────┤
│   Categoría: Electro    │ (full, left)
├─────────────────────────┤
│      Gs. 125.000        │ (full, center, blue)
├─────────────────────────┤
│  Stock: 150 │ Mín: 5    │ (left | right)
├─────────────────────────┤
│   [AGREGAR CARRITO]     │
└─────────────────────────┘
```

## Arquitectura Técnica

### Base de Datos

**Tabla**: `systemConfig`

**Nuevas configuraciones:**

1. **product_card_fields** (actualizado)
```json
{
  "field": "name",
  "label": "Nombre",
  "enabled": true,
  "order": 1,
  "displayType": "text",
  "column": "full",
  "textColor": "#000000",
  "fontSize": "14",
  "fontWeight": "600",
  "textAlign": "center"
}
```

2. **product_card_margins**
```json
{
  "top": 6,
  "bottom": 8,
  "left": 6,
  "right": 6
}
```

3. **product_card_image_spacing**
```
"16"
```

4. **product_card_field_spacing**
```
"4"
```

### Backend (server/routers.ts)

**Nuevos endpoints:**

```typescript
// Obtener estilos de tarjeta
config.getCardStyles: protectedProcedure.query()

// Actualizar estilos de tarjeta
config.updateCardStyles: protectedProcedure
  .input(z.object({
    margins: z.object({
      top: z.number(),
      bottom: z.number(),
      left: z.number(),
      right: z.number(),
    }),
    imageSpacing: z.number(),
    fieldSpacing: z.number(),
  }))
  .mutation()
```

### Frontend

**Componentes actualizados:**

1. **ProductFieldsConfig.tsx**
   - Agregada sección "Estilos de Tarjeta"
   - Botón "Mostrar/Ocultar Estilos"
   - Controles de diseño por campo:
     - Select de columna (full/left/right)
     - Select de alineación (left/center/right)
     - Color picker + input hexadecimal
     - Input numérico de tamaño
     - Select de peso de fuente
   - Vista previa actualizada con layout en columnas
   - Guardado de estilos de tarjeta

2. **ProductCard.tsx**
   - Función `groupFieldsByRow()` para agrupar campos por filas
   - Aplicación de estilos inline por campo
   - Grid dinámico (1 o 2 columnas según configuración)
   - Aplicación de márgenes y espaciado de tarjeta
   - Renderizado condicional basado en `column`

### Flujo de Renderizado

```
┌─────────────────────────────────────┐
│   Configurador (Admin)              │
│   - Seleccionar columna             │
│   - Elegir color con picker         │
│   - Ajustar tamaño y peso           │
│   - Configurar márgenes             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Backend API                       │
│   - config.updateProductFields      │
│   - config.updateCardStyles         │
│   - Validación y guardado           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Base de Datos                     │
│   - product_card_fields (JSON)      │
│   - product_card_margins (JSON)     │
│   - product_card_*_spacing (string) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   ProductCard Component             │
│   - Obtiene configuración           │
│   - Agrupa campos por fila          │
│   - Aplica estilos inline           │
│   - Renderiza grid dinámico         │
└─────────────────────────────────────┘
```

## Ventajas

### 1. Flexibilidad Total de Diseño

Cada aspecto visual de la tarjeta es personalizable sin tocar código.

### 2. Layout Profesional

El sistema de columnas permite crear layouts organizados y profesionales similares a diseños de tiendas reales.

### 3. Identidad Visual

Los colores personalizables permiten adaptar el catálogo a la identidad de marca.

### 4. Optimización de Espacio

Los controles de márgenes y espaciado permiten ajustar la densidad de información según el dispositivo.

### 5. Vista Previa en Tiempo Real

Todos los cambios se visualizan instantáneamente, facilitando la experimentación.

## Casos de Uso Avanzados

### Caso 1: Tienda con Códigos de Ubicación

**Objetivo**: Facilitar el picking en almacén

**Configuración:**
- SKU (left, grande, negro)
- Ubicación (right, grande, azul)
- Stock (left, verde)
- Unidades/Caja (right, gris)

### Caso 2: Tienda con Promociones

**Objetivo**: Destacar ofertas especiales

**Configuración:**
- Línea 2 "¡OFERTA!" (full, center, rojo, grande, bold)
- Nombre (full, center)
- Precio (full, center, azul, muy grande)
- Línea 1 "Envío gratis" (full, center, verde)

### Caso 3: Catálogo Minimalista

**Objetivo**: Diseño limpio y simple

**Configuración:**
- Márgenes grandes (10-12px)
- Solo 3 campos: Nombre, Precio, Stock
- Todos full width, centrados
- Espaciado generoso entre campos

### Caso 4: Catálogo Denso

**Objetivo**: Máxima información en mínimo espacio

**Configuración:**
- Márgenes pequeños (4px)
- Espaciado mínimo (2px)
- Múltiples campos en 2 columnas
- Fuentes pequeñas (10-11px)

## Mejores Prácticas

### Diseño Visual

1. **Jerarquía Visual**
   - Nombre: Tamaño mediano, peso semibold
   - Precio: Tamaño grande, peso bold, color destacado
   - Información: Tamaño pequeño, peso normal

2. **Uso de Color**
   - Negro (#000000): Texto principal
   - Azul (#2563eb): Precios, acciones
   - Verde (#16a34a): Stock, disponibilidad
   - Rojo (#dc2626): Ofertas, urgencia
   - Gris (#6b7280): Información secundaria

3. **Espaciado**
   - Móvil: Márgenes pequeños (4-6px)
   - Desktop: Márgenes medianos (6-8px)
   - Espacio imagen-contenido: 12-16px
   - Espacio entre campos: 4-6px

### Layout en Columnas

1. **Campos Relacionados**
   - Agrupar información relacionada en la misma fila
   - Ejemplo: SKU | Ubicación (ambos códigos)
   - Ejemplo: Stock | Unidades/Caja (ambos cantidades)

2. **Balance Visual**
   - Evitar mezclar campos muy largos con muy cortos
   - Usar alineación consistente (left con left, right con right)

3. **Campos Destacados**
   - Usar full width para información importante
   - Ejemplo: Nombre, Precio, Promociones

### Rendimiento

1. **Caché**
   - La configuración se cachea por 5 minutos
   - Refrescar página para ver cambios inmediatos

2. **Optimización**
   - Evitar demasiados campos activos (máx 8-10)
   - Usar colores simples (hexadecimales)
   - Mantener tamaños de fuente razonables

## Solución de Problemas

### Los campos no se alinean correctamente

**Problema**: Campos left y right no aparecen en la misma fila

**Solución**: 
- Verificar que un campo left sea seguido por un campo right
- Reordenar campos con drag & drop
- Asegurar que ambos campos estén activos

### Los colores no se aplican

**Problema**: El color configurado no se muestra en el catálogo

**Solución**:
- Verificar que el código hexadecimal sea válido (#RRGGBB)
- Refrescar la página del catálogo (F5)
- Limpiar caché del navegador si persiste

### La vista previa no coincide con el catálogo

**Problema**: La tarjeta real se ve diferente a la vista previa

**Solución**:
- La vista previa usa datos de ejemplo
- Algunos campos pueden no tener valor en productos reales
- Verificar en el catálogo con productos reales

### Márgenes muy pequeños en móvil

**Problema**: El contenido se ve apretado en dispositivos móviles

**Solución**:
- Aumentar márgenes laterales a 8-10px
- Aumentar espaciado entre campos a 6-8px
- Reducir número de campos activos

## Próximas Mejoras Sugeridas

1. **Plantillas de Estilo**: Guardar y cargar configuraciones predefinidas
2. **Responsive por Dispositivo**: Diferentes estilos para móvil/desktop
3. **Bordes y Sombras**: Personalizar bordes de campos
4. **Fondos de Campo**: Colores de fondo para campos individuales
5. **Iconos**: Agregar iconos antes de campos
6. **Animaciones**: Transiciones y hover effects personalizables

## Commit

**Hash**: 5a9e66f  
**Mensaje**: feat: Configurador avanzado con layout en columnas, estilos y colores personalizables

**Archivos modificados**: 3  
**Líneas agregadas**: +525  
**Líneas eliminadas**: -100

**Archivos clave**:
- `client/src/pages/admin/ProductFieldsConfig.tsx` (actualizado)
- `client/src/components/ProductCard.tsx` (actualizado)
- `server/routers.ts` (actualizado)

## Conclusión

El configurador avanzado proporciona control total sobre el diseño visual de las tarjetas de producto, permitiendo crear layouts profesionales y personalizados sin necesidad de programar. El sistema de columnas, combinado con controles de color, tamaño y espaciado, ofrece infinitas posibilidades de personalización para adaptar el catálogo a cualquier necesidad de negocio.

---

**Proyecto**: IMPORKAM Tienda B2B  
**Versión**: 1.2.0 (con configurador avanzado de estilos)  
**Último Commit**: 5a9e66f  
**Fecha**: 22 de Octubre, 2025

