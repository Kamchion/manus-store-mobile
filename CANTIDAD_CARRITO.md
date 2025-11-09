# Modificar Cantidades en el Carrito - IMPORKAM

**Fecha:** 22 de octubre de 2025  
**Commit:** `697da92`

---

## Resumen

Se ha implementado la **funcionalidad para modificar cantidades** de productos directamente en el carrito de compras, sin necesidad de volver a la página del producto. Ahora los usuarios pueden aumentar o disminuir las cantidades con botones **+** y **-**.

---

## Características Implementadas

### Controles de Cantidad

✅ **Botón -** (Menos)
- Disminuye la cantidad en 1
- Si la cantidad llega a 0, elimina el producto automáticamente
- Icono: Minus (-)

✅ **Botón +** (Más)
- Aumenta la cantidad en 1
- Sin límite superior (validación de stock en backend)
- Icono: Plus (+)

✅ **Display de Cantidad**
- Muestra la cantidad actual entre los botones
- Centrado y legible
- Ancho mínimo de 24px

### Comportamiento

- **Actualización inmediata:** Los cambios se reflejan instantáneamente
- **Recalculo automático:** Subtotal, impuesto y total se actualizan automáticamente
- **Eliminación inteligente:** Si la cantidad llega a 0, el producto se elimina del carrito
- **Estados de carga:** Los botones se deshabilitan mientras se actualiza
- **Feedback visual:** Toast de error si algo falla

---

## Estructura Técnica

### Backend

#### Función: `updateCartItemQuantity()`
**Ubicación:** `server/db.ts`

```typescript
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update cart item: database not available");
    return false;
  }

  if (quantity <= 0) {
    // Si la cantidad es 0 o negativa, eliminar el item
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  } else {
    // Actualizar la cantidad
    await db
      .update(cartItems)
      .set({ 
        quantity,
        updatedAt: new Date()
      })
      .where(eq(cartItems.id, cartItemId));
  }

  return true;
}
```

**Características:**
- ✅ Valida si la cantidad es 0 o negativa → Elimina el item
- ✅ Actualiza el timestamp `updatedAt`
- ✅ Retorna `true` si la operación fue exitosa

#### Ruta tRPC: `cart.updateQuantity`
**Ubicación:** `server/routers.ts`

```typescript
updateQuantity: protectedProcedure
  .input(
    z.object({
      cartItemId: z.string(),
      quantity: z.number().int().min(0),
    })
  )
  .mutation(async ({ input, ctx }) => {
    await updateCartItemQuantity(input.cartItemId, input.quantity);
    await logAudit(
      ctx.user.id,
      "CART_UPDATE_QUANTITY",
      "cartItem",
      input.cartItemId,
      `Cantidad actualizada a ${input.quantity}`
    );
    return { success: true };
  })
```

**Validaciones:**
- ✅ `cartItemId` debe ser string
- ✅ `quantity` debe ser número entero ≥ 0
- ✅ Usuario debe estar autenticado
- ✅ Registro de auditoría automático

### Frontend

#### Componente: `Cart.tsx`
**Ubicación:** `client/src/pages/Cart.tsx`

**Mutación tRPC:**
```typescript
const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
```

**Handler:**
```typescript
const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
  if (newQuantity < 1) {
    // Si la cantidad es menor a 1, remover el item
    await handleRemoveItem(cartItemId);
    return;
  }
  
  try {
    await updateQuantityMutation.mutateAsync({ cartItemId, quantity: newQuantity });
    await refetch();
  } catch (error: any) {
    toast.error(error.message || "Error al actualizar cantidad");
  }
};
```

**UI de Controles:**
```tsx
<div className="flex flex-col items-center gap-1">
  <p className="text-gray-600 text-xs">Cant.</p>
  <div className="flex items-center gap-1">
    <button
      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
      disabled={updateQuantityMutation.isPending}
      className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
      title="Disminuir cantidad"
    >
      <Minus className="h-3 w-3" />
    </button>
    <span className="font-semibold text-sm min-w-[24px] text-center">
      {item.quantity}
    </span>
    <button
      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
      disabled={updateQuantityMutation.isPending}
      className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
      title="Aumentar cantidad"
    >
      <Plus className="h-3 w-3" />
    </button>
  </div>
</div>
```

---

## Diseño Visual

### Antes

```
Precio    Cant.    Total    [🗑️]
$10.00      5      $50.00
```

### Ahora

```
Precio    Cant.     Total    [🗑️]
$10.00   [-] 5 [+]  $50.00
```

### Características del Diseño

- **Botones compactos:** 6x6 píxeles (24x24px)
- **Iconos pequeños:** 3x3 píxeles (12x12px)
- **Borde gris:** `border-gray-300`
- **Hover:** Fondo gris claro `bg-gray-100`
- **Disabled:** Opacidad 50%
- **Gap:** 1 unidad (4px) entre elementos

---

## Cómo Usar

### Para Clientes

1. **Ir al Carrito**
   - Hacer clic en el icono del carrito
   - O ir a `/cart`

2. **Modificar Cantidad**
   - **Aumentar:** Hacer clic en el botón **+**
   - **Disminuir:** Hacer clic en el botón **-**
   - La cantidad se actualiza inmediatamente

3. **Eliminar Producto**
   - **Opción 1:** Disminuir hasta llegar a 0
   - **Opción 2:** Hacer clic en el botón 🗑️

4. **Ver Totales Actualizados**
   - Subtotal, impuesto y total se recalculan automáticamente
   - Cambios visibles en tiempo real

---

## Flujo de Actualización

```
1. Usuario hace clic en [+] o [-]
   ↓
2. handleUpdateQuantity() se ejecuta
   ↓
3. Si newQuantity < 1 → handleRemoveItem()
   Si newQuantity ≥ 1 → updateQuantityMutation()
   ↓
4. Backend actualiza la base de datos
   ↓
5. refetch() obtiene los datos actualizados
   ↓
6. UI se actualiza con nuevos totales
```

---

## Validaciones

### Frontend
- ✅ Si cantidad < 1 → Eliminar producto
- ✅ Deshabilitar botones durante actualización
- ✅ Mostrar error si la mutación falla

### Backend
- ✅ Validar que `quantity` sea número entero
- ✅ Validar que `quantity` ≥ 0
- ✅ Si quantity ≤ 0 → Eliminar item de la base de datos
- ✅ Actualizar timestamp `updatedAt`

---

## Auditoría

Cada cambio de cantidad se registra en `auditLogs`:

```sql
{
  userId: "user_id",
  action: "CART_UPDATE_QUANTITY",
  tableName: "cartItem",
  recordId: "cart_item_id",
  details: "Cantidad actualizada a 3"
}
```

**Información registrada:**
- Quién hizo el cambio
- Qué item se modificó
- Nueva cantidad
- Timestamp

---

## Archivos Modificados

```
server/
├── db.ts                          # Agregada función updateCartItemQuantity()
└── routers.ts                     # Agregada ruta cart.updateQuantity

client/src/pages/
└── Cart.tsx                       # Agregados controles +/- y lógica
```

**Cambios:**
- `server/db.ts`: +29 líneas (función updateCartItemQuantity)
- `server/routers.ts`: +21 líneas (ruta tRPC + import)
- `client/src/pages/Cart.tsx`: +41 líneas (controles UI + handlers)

---

## Mejoras Futuras

### Posibles Extensiones

1. **Input Manual de Cantidad:**
   - Permitir escribir la cantidad directamente
   - Validar en tiempo real
   - Enter para confirmar

2. **Validación de Stock:**
   - Mostrar stock disponible
   - Deshabilitar [+] si no hay stock
   - Mensaje de advertencia

3. **Animaciones:**
   - Transición suave al cambiar cantidad
   - Feedback visual al actualizar
   - Shake si hay error

4. **Atajos de Teclado:**
   - Flechas arriba/abajo para cambiar cantidad
   - Delete para eliminar item
   - Enter para checkout

5. **Cantidades Predefinidas:**
   - Botones rápidos: x2, x5, x10
   - Para productos que se compran en bulk

---

## Pruebas

### Probar Aumentar Cantidad

1. Agregar un producto al carrito
2. Ir al carrito
3. Hacer clic en [+] varias veces
4. Verificar que:
   - La cantidad aumenta
   - El total se recalcula
   - El subtotal y el total general se actualizan

### Probar Disminuir Cantidad

1. Tener un producto con cantidad > 1
2. Hacer clic en [-]
3. Verificar que:
   - La cantidad disminuye
   - El total se recalcula

### Probar Eliminar con [-]

1. Tener un producto con cantidad = 1
2. Hacer clic en [-]
3. Verificar que:
   - El producto se elimina del carrito
   - Aparece toast: "Producto removido del carrito"
   - El carrito se actualiza

### Probar Estados de Carga

1. Hacer clic en [+] o [-]
2. Verificar que:
   - Los botones se deshabilitan
   - Opacidad 50% mientras carga
   - Se habilitan después de actualizar

### Probar Errores

1. Desconectar internet
2. Hacer clic en [+] o [-]
3. Verificar que:
   - Aparece toast de error
   - La cantidad no cambia
   - Los botones se rehabilitan

---

## Soporte

Para cualquier problema:

1. **Botones no responden:**
   - Verificar que el usuario esté autenticado
   - Revisar consola del navegador
   - Verificar que el servidor esté corriendo

2. **Cantidad no se actualiza:**
   - Verificar conexión a internet
   - Revisar logs del servidor
   - Verificar que el cartItemId sea válido

3. **Totales incorrectos:**
   - Refrescar la página
   - Verificar que refetch() se ejecute
   - Revisar cálculos en el componente

---

## Changelog

### v1.0.0 - 22 de octubre de 2025

**Agregado:**
- ✅ Función `updateCartItemQuantity()` en backend
- ✅ Ruta tRPC `cart.updateQuantity`
- ✅ Botones [+] y [-] en el carrito
- ✅ Handler `handleUpdateQuantity()`
- ✅ Eliminación automática si cantidad = 0
- ✅ Estados de carga en botones
- ✅ Auditoría de cambios de cantidad

**Commit:** `697da92` - Agregar controles de cantidad (+/-) en el carrito de compras

---

**Desarrollado por:** Manus AI  
**Cliente:** IMPORKAM  
**Proyecto:** Tienda B2B

