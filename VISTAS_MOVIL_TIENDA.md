# Vistas Móviles - Tienda B2B IMPORKAM

**Fecha:** 22 de octubre de 2025  
**Diseño Responsive:** Optimizado para móviles

---

## 📱 Vista General en Móvil

Todas las páginas de la tienda están optimizadas para dispositivos móviles con las siguientes características:

✅ **Header Compacto** - 48px de altura (ahorra espacio vertical)  
✅ **Logo IMPORKAM** - 32x32px en móvil  
✅ **Navegación Responsive** - Se adapta al tamaño de pantalla  
✅ **Controles Táctiles** - Botones grandes y fáciles de presionar  

---

## 1. 🏠 Página de Inicio (Home)

```
┌─────────────────────────────────┐
│ [🔵 IMPORKAM]    🛒 👤 ☰       │ ← Header compacto (48px)
├─────────────────────────────────┤
│                                 │
│   Bienvenido a IMPORKAM         │
│   Tu distribuidor de confianza  │
│                                 │
│   [Ver Productos]               │
│   [Ver Pedidos]                 │
│                                 │
└─────────────────────────────────┘
```

**Características:**
- Header sticky (siempre visible)
- Logo cuadrado azul de IMPORKAM
- Iconos de carrito y usuario a la derecha
- Menú hamburguesa para navegación

---

## 2. 🛍️ Página de Productos

```
┌─────────────────────────────────┐
│ [🔵]              🛒 👤 ☰       │ ← Header (48px)
├─────────────────────────────────┤
│ [🔍 Buscar...] [Todas ▼]       │ ← Búsqueda + Categorías
├─────────────────────────────────┤ ← (Lado a lado, sticky)
│                                 │
│ ┌─────────────┬─────────────┐  │
│ │             │             │  │
│ │  [Imagen]   │  [Imagen]   │  │ ← Grid 2 columnas
│ │  Producto 1 │  Producto 2 │  │
│ │  $25.00     │  $30.00     │  │
│ │  [+ Cart]   │  [+ Cart]   │  │
│ └─────────────┴─────────────┘  │
│                                 │
│ ┌─────────────┬─────────────┐  │
│ │  [Imagen]   │  [Imagen]   │  │
│ │  Producto 3 │  Producto 4 │  │
│ │  $15.00     │  $40.00     │  │
│ │  [+ Cart]   │  [+ Cart]   │  │
│ └─────────────┴─────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Optimizaciones Móviles:**
- ✅ Búsqueda y categorías en la MISMA línea (ahorra espacio)
- ✅ Campo de búsqueda flexible (crece)
- ✅ Dropdown de categorías compacto (128px)
- ✅ Grid de 2 columnas para productos
- ✅ Imágenes cuadradas responsive
- ✅ Botones de agregar al carrito grandes

---

## 3. 📦 Modal de Variantes (Productos Variables)

```
┌─────────────────────────────────┐
│  Seleccionar Variante      [X]  │
├─────────────────────────────────┤
│                                 │
│ ┌──────────┬──────────┐        │
│ │ Talla S  │ Talla M  │        │ ← 2 columnas
│ │ ABC-S    │ ABC-M    │        │
│ │ 10 disp. │ 15 disp. │        │
│ │          │          │        │
│ │ [Imagen] │ [Imagen] │        │ ← Imágenes cuadradas
│ │          │          │        │
│ │  $25.00  │  $25.00  │        │
│ │ [-] 0[+] │ [-] 0[+] │        │ ← Controles compactos
│ └──────────┴──────────┘        │
│                                 │
│ ┌──────────┬──────────┐        │
│ │ Talla L  │ Talla XL │        │
│ │ ABC-L    │ ABC-XL   │        │
│ │ 20 disp. │ 8 disp.  │        │
│ │          │          │        │
│ │ [Imagen] │ [Imagen] │        │
│ │          │          │        │
│ │  $25.00  │  $25.00  │        │
│ │ [-] 0[+] │ [-] 0[+] │        │
│ └──────────┴──────────┘        │
│                                 │
│      [Agregar al Carrito]       │
│                                 │
└─────────────────────────────────┘
```

**Optimizaciones:**
- ✅ 2 columnas en lugar de 1 (ahorra scroll)
- ✅ Layout vertical: Descripción → Imagen → Precio/Cantidad
- ✅ Imágenes cuadradas grandes (192x192px → responsive)
- ✅ Controles compactos pero táctiles
- ✅ 50% menos scroll para ver todas las variantes

---

## 4. 🛒 Carrito de Compras

```
┌─────────────────────────────────┐
│ [🔵]              🛒 👤 ☰       │
├─────────────────────────────────┤
│ [← Volver al Catálogo]          │
├─────────────────────────────────┤
│                                 │
│ Carrito de Compras              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [📷] Producto 1             │ │
│ │      SKU: ABC123            │ │
│ │                             │ │
│ │ Precio  Cant.     Total     │ │
│ │ $10.00  [-][5][+] $50.00 🗑️│ │ ← Input editable
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [📷] Producto 2             │ │
│ │      SKU: XYZ789            │ │
│ │                             │ │
│ │ Precio  Cant.     Total     │ │
│ │ $25.00  [-][2][+] $50.00 🗑️│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Resumen del Pedido          │ │
│ │ 2 producto(s)               │ │
│ │                             │ │
│ │ Subtotal:          $100.00  │ │
│ │ Impuesto (10%):     $10.00  │ │
│ │ ─────────────────────────   │ │
│ │ Total:             $110.00  │ │
│ │                             │ │
│ │ ℹ️ Impuesto incluido        │ │
│ │                             │ │
│ │    [ENVIAR PEDIDO]          │ │
│ │    [Seguir Comprando]       │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Funcionalidades del Carrito:**
- ✅ **Botones [-] y [+]** para ajustar cantidad
- ✅ **Input editable** - Hacer clic y escribir cantidad directamente
- ✅ **Selección automática** - Al hacer clic, se selecciona todo el número
- ✅ **Actualización en tiempo real** - Totales se recalculan automáticamente
- ✅ **Eliminación inteligente** - Si cantidad llega a 0, se elimina el producto
- ✅ **Botón de eliminar** - Icono de basura para eliminar directamente

**Experiencia de Usuario:**
1. Hacer clic en el número de cantidad → Se selecciona: **[5]**
2. Escribir nuevo número: "10"
3. Automáticamente se actualiza el total
4. No necesitas borrar el número anterior

---

## 5. 📋 Mis Pedidos

```
┌─────────────────────────────────┐
│ [🔵]              🛒 👤 ☰       │
├─────────────────────────────────┤
│                                 │
│ Mis Pedidos                     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Pedido #12345               │ │
│ │ 📅 22 Oct 2025              │ │
│ │ 🟡 Pendiente                │ │
│ │ Total: $110.00              │ │
│ │                             │ │
│ │ [Ver Detalles]              │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Pedido #12344               │ │
│ │ 📅 20 Oct 2025              │ │
│ │ ✅ Completado               │ │
│ │ Total: $250.00              │ │
│ │                             │ │
│ │ [Ver Detalles]              │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Características:**
- Lista de pedidos en tarjetas
- Estados con colores (Pendiente, Completado, Cancelado)
- Información resumida
- Botón para ver detalles completos

---

## 6. 👤 Perfil de Usuario

```
┌─────────────────────────────────┐
│ [🔵]              🛒 👤 ☰       │
├─────────────────────────────────┤
│                                 │
│ Mi Perfil                       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 test@ejemplo.com         │ │
│ │                             │ │
│ │ Empresa: Empresa Test S.A.  │ │
│ │ Rol: Cliente                │ │
│ │ Tipo Precio: Ciudad         │ │
│ │                             │ │
│ │ 📞 +598 99 123 456          │ │
│ │ 📍 Montevideo, Uruguay      │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Editar Perfil]                 │
│ [Cambiar Contraseña]            │
│ [Cerrar Sesión]                 │
│                                 │
└─────────────────────────────────┘
```

---

## 7. 🔐 Panel de Administración (Admin)

```
┌─────────────────────────────────┐
│ [🔵]              🛒 👤 ☰       │
├─────────────────────────────────┤
│                                 │
│ Panel de Administración         │
│                                 │
│ [Productos] [Usuarios] [Pedidos]│
│ [Promociones] [Configuración]   │ ← Tabs horizontales
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Gestión de Usuarios         │ │
│ │                             │ │
│ │ [+ Nuevo Usuario]           │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ test@ejemplo.com        │ │ │
│ │ │ Empresa Test S.A.       │ │ │
│ │ │ Cliente | Ciudad        │ │ │
│ │ │                         │ │ │
│ │ │ ✏️ ❄️ 🔑 🗑️            │ │ │ ← Acciones
│ │ └─────────────────────────┘ │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ admin@tienda.com        │ │ │
│ │ │ Administración          │ │ │
│ │ │ Admin | Ciudad          │ │ │
│ │ │                         │ │ │
│ │ │ ✏️ ❄️ 🔑 🗑️            │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

**Acciones en Usuarios:**
- ✏️ **Editar** - Modificar toda la información del cliente
- ❄️ **Congelar/Activar** - Cambiar estado de la cuenta
- 🔑 **Cambiar Contraseña** - Asignar nueva contraseña
- 🗑️ **Eliminar** - Eliminar usuario

---

## 8. ⚙️ Configuración del Sistema (Admin)

```
┌─────────────────────────────────┐
│ [🔵]              🛒 👤 ☰       │
├─────────────────────────────────┤
│                                 │
│ Configuración del Sistema       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Configuración de Emails     │ │
│ │                             │ │
│ │ Email FROM:                 │ │
│ │ [chjulio79@gmail.com     ]  │ │
│ │                             │ │
│ │ Emails TO (separados por ,):│ │
│ │ [ikampedidos@gmail.com,  ]  │ │
│ │ [ikamcorreo@gmail.com    ]  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Pop-up de Anuncios          │ │
│ │                             │ │
│ │ Activar Pop-up: [✓]         │ │
│ │                             │ │
│ │ Título:                     │ │
│ │ [Bienvenido a IMPORKAM   ]  │ │
│ │                             │ │
│ │ Mensaje:                    │ │
│ │ [Tenemos nuevas ofertas  ]  │ │
│ │ [especiales para ti...   ]  │ │
│ │                             │ │
│ │ Vista Previa:               │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ Bienvenido a IMPORKAM   │ │ │
│ │ │                         │ │ │
│ │ │ Tenemos nuevas ofertas  │ │ │
│ │ │ especiales para ti...   │ │ │
│ │ │                         │ │ │
│ │ │        [Cerrar]         │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Guardar Configuración]         │
│                                 │
└─────────────────────────────────┘
```

---

## 📊 Optimizaciones Implementadas

### Ahorro de Espacio Vertical

| Elemento | Antes | Ahora | Ahorro |
|----------|-------|-------|--------|
| Header | 64px | 48px | **16px** |
| Búsqueda + Categorías | 2 líneas (112px) | 1 línea (56px) | **56px** |
| Modal de Variantes | 1 columna | 2 columnas | **50% scroll** |
| **Total ahorro** | - | - | **~70px + 50% scroll** |

### Mejoras de UX

✅ **Controles Táctiles Grandes**
- Botones mínimo 24x24px (fáciles de presionar)
- Áreas de clic amplias
- Espaciado adecuado entre elementos

✅ **Input Editable en Carrito**
- Hacer clic → Selección automática
- Escribir directamente sin borrar
- Actualización en tiempo real

✅ **Navegación Optimizada**
- Header sticky (siempre visible)
- Búsqueda y categorías sticky
- Scroll suave y natural

✅ **Diseño Responsive**
- Grid de 2 columnas en productos
- Grid de 2 columnas en variantes
- Tarjetas apiladas en listas
- Formularios de 1 columna en móvil

---

## 🎨 Paleta de Colores

- **Azul Primario:** Logo IMPORKAM, botones principales
- **Verde:** Botón de editar (✏️)
- **Azul Claro:** Botón de congelar/activar (❄️/✅)
- **Amarillo:** Botón de cambiar contraseña (🔑)
- **Rojo:** Botón de eliminar (🗑️)
- **Gris:** Bordes, fondos secundarios

---

## 📱 Dispositivos Soportados

✅ **iPhone SE** (375x667px)  
✅ **iPhone 12/13/14** (390x844px)  
✅ **iPhone 14 Pro Max** (430x932px)  
✅ **Samsung Galaxy S21** (360x800px)  
✅ **Samsung Galaxy S21 Ultra** (412x915px)  
✅ **iPad Mini** (768x1024px)  
✅ **iPad Pro** (1024x1366px)  

---

## 🚀 Rendimiento Móvil

✅ **Carga Rápida** - Imágenes optimizadas  
✅ **Scroll Suave** - Animaciones optimizadas  
✅ **Sin Lag** - Actualizaciones eficientes  
✅ **Offline Ready** - Service Worker (futuro)  

---

## 📝 Notas Técnicas

### Breakpoints Responsive

```css
/* Móvil */
< 640px (sm)  → 1 columna, header compacto

/* Tablet */
640px - 768px (md) → 2 columnas, header normal

/* Desktop */
> 768px (lg) → 3+ columnas, sidebar visible
```

### Clases Tailwind Clave

- `h-12` → Header móvil (48px)
- `h-14` → Header desktop (56px)
- `top-12` → Sticky móvil (48px)
- `top-14` → Sticky desktop (56px)
- `grid-cols-2` → 2 columnas en móvil
- `md:grid-cols-3` → 3 columnas en tablet
- `lg:grid-cols-4` → 4 columnas en desktop

---

## ✨ Resumen de Funcionalidades Móviles

1. ✅ **Header compacto** - Ahorra 16px de altura
2. ✅ **Búsqueda y categorías lado a lado** - Ahorra 56px
3. ✅ **Modal de variantes 2 columnas** - 50% menos scroll
4. ✅ **Carrito con input editable** - Cambio rápido de cantidad
5. ✅ **Selección automática** - Sobrescribir sin borrar
6. ✅ **Controles +/-** - Ajuste fino de cantidad
7. ✅ **Logo IMPORKAM** - Branding visible
8. ✅ **Panel de configuración** - Emails y pop-ups
9. ✅ **Edición de clientes** - Modal completo
10. ✅ **Diseño responsive** - Se adapta a cualquier tamaño

---

**Desarrollado por:** Manus AI  
**Cliente:** IMPORKAM  
**Proyecto:** Tienda B2B  
**Fecha:** 22 de octubre de 2025

