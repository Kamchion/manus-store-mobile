# Carga de Imágenes en Edición de Productos

## ✨ Nueva Funcionalidad

Ahora puedes **cargar y eliminar imágenes** directamente desde el formulario de edición de productos en el Panel de Administración.

---

## 🎯 Características

### 1. **Vista Previa de Imagen**
- Muestra la imagen actual del producto (si existe)
- Tamaño: 128x128px
- Bordes redondeados

### 2. **Cargar Nueva Imagen**
- Selecciona archivo desde tu dispositivo
- Formatos soportados: JPG, PNG, WebP, GIF
- Tamaño máximo: 5MB
- Optimización automática a 800x800px

### 3. **Eliminar Imagen**
- Botón rojo en la esquina superior derecha de la vista previa
- Elimina la referencia de la imagen (no borra el archivo físico)

### 4. **URL Alternativa**
- Campo de texto para ingresar URL de imagen externa
- Útil para imágenes hospedadas en otros servidores

---

## 📋 Cómo Usar

### Desde Panel de Administración

1. **Ir a**: Panel de Administración → Productos
2. **Hacer clic** en el botón "Editar" (ícono de lápiz) del producto
3. **En el formulario**:
   - **Ver imagen actual**: Se muestra automáticamente si existe
   - **Cargar nueva imagen**: Clic en "Choose File" y seleccionar imagen
   - **Eliminar imagen**: Clic en botón rojo con ícono de basura
   - **URL externa**: Ingresar URL en el campo de texto

### Proceso de Carga

1. **Seleccionar archivo** desde tu dispositivo
2. **Carga automática**: La imagen se sube inmediatamente
3. **Optimización**: Se procesa y optimiza automáticamente
4. **Vista previa**: Se muestra la imagen cargada
5. **Guardar**: Hacer clic en "Guardar Producto" para confirmar cambios

---

## 🔧 Detalles Técnicos

### Backend

**Archivo**: `server/product-image-upload.ts`

**Endpoint**: `POST /api/upload/product-image`

**Parámetros**:
- `image`: Archivo de imagen (multipart/form-data)
- `sku`: SKU del producto

**Respuesta**:
```json
{
  "success": true,
  "imagePath": "/uploads/products/SKU.jpg",
  "message": "Imagen subida correctamente"
}
```

**Proceso**:
1. Recibe archivo vía multer
2. Valida tipo y tamaño
3. Guarda temporalmente en `/tmp/product-images/`
4. Optimiza con Sharp (800x800px, calidad 85%)
5. Guarda en `public/uploads/products/{SKU}.jpg`
6. Elimina archivo temporal
7. Retorna ruta de la imagen

### Frontend

**Archivo**: `client/src/pages/AdminPanel.tsx`

**Componente**: `ProductForm`

**Características**:
- Input type="file" para selección de archivo
- Fetch API para carga asíncrona
- FormData para envío multipart
- Vista previa con imagen actual
- Botón de eliminación con confirmación visual

---

## 📊 Especificaciones de Imagen

| Característica | Valor |
|----------------|-------|
| **Formato de salida** | JPG (JPEG progresivo) |
| **Dimensiones** | 800x800px (cover fit) |
| **Calidad** | 85% |
| **Tamaño máximo de entrada** | 5MB |
| **Formatos aceptados** | JPG, PNG, WebP, GIF |
| **Nombre de archivo** | `{SKU}.jpg` |
| **Ubicación** | `public/uploads/products/` |
| **URL de acceso** | `/uploads/products/{SKU}.jpg` |

---

## 🔐 Seguridad

### Validaciones

✅ **Tipo de archivo**: Solo imágenes permitidas
✅ **Tamaño máximo**: 5MB
✅ **SKU requerido**: No se permite carga sin SKU
✅ **Sanitización**: Nombres de archivo únicos con nanoid

### Limitaciones

- Solo usuarios con acceso al panel de administración pueden cargar imágenes
- Un archivo por request
- Sobrescribe imagen existente con el mismo SKU

---

## 📁 Estructura de Archivos

```
/home/ubuntu/
├── public/
│   └── uploads/
│       └── products/
│           ├── TEST-001.jpg
│           ├── WIDGET-100.jpg
│           └── ... (imágenes de productos)
├── server/
│   ├── product-image-upload.ts  ← Nuevo handler
│   ├── image-optimizer.ts       ← Optimización
│   └── _core/
│       └── index.ts             ← Ruta agregada
└── client/
    └── src/
        └── pages/
            └── AdminPanel.tsx   ← Formulario actualizado
```

---

## ✅ Pruebas Realizadas

### Test de Carga

```bash
curl -X POST http://localhost:3001/api/upload/product-image \
  -F "image=@/tmp/test-product.jpg" \
  -F "sku=TEST-001"
```

**Resultado**:
```json
{
  "success": true,
  "imagePath": "/uploads/products/TEST-001.jpg",
  "message": "Imagen subida correctamente"
}
```

### Verificación

✅ **Archivo creado**: `public/uploads/products/TEST-001.jpg`
✅ **Tamaño**: 1.7KB (optimizado desde ~12KB)
✅ **Formato**: JPEG progresivo, 400x400px
✅ **Accesible**: `http://localhost:3001/uploads/products/TEST-001.jpg`

---

## 🎨 Interfaz de Usuario

### Vista Previa con Imagen

```
┌─────────────────────────────────┐
│ Imagen del Producto             │
├─────────────────────────────────┤
│  ┌──────────┐                   │
│  │          │ [X]  ← Botón      │
│  │  Imagen  │      eliminar     │
│  │          │                   │
│  └──────────┘                   │
│                                 │
│  [Choose File] JPG, PNG, WebP  │
│                                 │
│  O ingresa una URL              │
│  [___________________________]  │
└─────────────────────────────────┘
```

### Sin Imagen

```
┌─────────────────────────────────┐
│ Imagen del Producto             │
├─────────────────────────────────┤
│  [Choose File] JPG, PNG, WebP  │
│                                 │
│  O ingresa una URL              │
│  [___________________________]  │
└─────────────────────────────────┘
```

---

## 💡 Casos de Uso

### 1. Agregar Imagen a Producto Nuevo
1. Crear producto con SKU
2. Cargar imagen desde dispositivo
3. Guardar producto

### 2. Actualizar Imagen de Producto Existente
1. Editar producto
2. Cargar nueva imagen (sobrescribe la anterior)
3. Guardar cambios

### 3. Eliminar Imagen de Producto
1. Editar producto
2. Clic en botón rojo de eliminar
3. Guardar cambios

### 4. Usar Imagen Externa
1. Editar producto
2. Ingresar URL en campo de texto
3. Guardar cambios

---

## 🚀 Beneficios

✅ **Facilidad de uso**: Carga directa desde el formulario
✅ **Vista previa inmediata**: Ver la imagen antes de guardar
✅ **Optimización automática**: Tamaño y calidad optimizados
✅ **Flexibilidad**: Carga desde dispositivo o URL externa
✅ **Gestión completa**: Cargar, ver y eliminar en un solo lugar

---

## 📝 Notas

- Las imágenes se optimizan automáticamente para mejor rendimiento
- El nombre del archivo siempre es el SKU del producto
- Si cambias el SKU del producto, la imagen no se renombra automáticamente
- La eliminación de imagen solo quita la referencia, no borra el archivo físico
- Puedes tener múltiples productos apuntando a la misma imagen usando URLs

---

## 🔄 Flujo Completo

```
Usuario selecciona imagen
         ↓
Frontend: FormData con imagen + SKU
         ↓
POST /api/upload/product-image
         ↓
Backend: Recibe y valida
         ↓
Optimiza con Sharp (800x800px)
         ↓
Guarda en public/uploads/products/{SKU}.jpg
         ↓
Retorna ruta: /uploads/products/{SKU}.jpg
         ↓
Frontend: Actualiza vista previa
         ↓
Usuario guarda producto
         ↓
Imagen asociada al producto en BD
```

