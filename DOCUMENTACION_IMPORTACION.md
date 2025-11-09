# Sistema de Importación Masiva de Productos

## 📋 Resumen

Se ha implementado un sistema completo de importación masiva de productos con imágenes desde archivos Excel, incluyendo optimización automática de imágenes al tamaño estándar del catálogo (400x400px).

---

## ✨ Características Implementadas

### 1. **Backend - Procesamiento de Archivos**

#### Archivos creados:
- `/home/ubuntu/server/image-optimizer.ts` - Servicio de optimización de imágenes
- `/home/ubuntu/server/import-service.ts` - Servicio de importación de productos desde Excel
- `/home/ubuntu/server/upload-handler.ts` - Manejador de uploads HTTP
- `/home/ubuntu/server/import-router.ts` - Router tRPC para importación

#### Funcionalidades:
- **Optimización automática de imágenes**:
  - Redimensionamiento a 400x400px
  - Mantenimiento de aspecto ratio con crop inteligente
  - Conversión a JPEG optimizado (calidad 85%)
  - Nombres de archivo únicos para evitar colisiones

- **Procesamiento de Excel**:
  - Lectura de archivos .xlsx y .xls
  - Validación de columnas requeridas
  - Manejo de errores por fila
  - Reporte detallado de importación

- **Asociación de imágenes**:
  - Mapeo automático por SKU
  - Soporte para múltiples formatos (JPG, PNG, WEBP, GIF)
  - Manejo de imágenes faltantes

### 2. **Frontend - Interfaz de Usuario**

#### Archivos creados/modificados:
- `/home/ubuntu/client/src/components/ProductImport.tsx` - Componente de importación
- `/home/ubuntu/client/src/pages/AdminPanel.tsx` - Pestaña de importación agregada

#### Características de la interfaz:
- **Instrucciones claras** paso a paso
- **Descarga de plantilla Excel** con columnas predefinidas
- **Upload de archivos**:
  - Campo para archivo Excel (obligatorio)
  - Campo para imágenes múltiples (opcional)
- **Indicadores visuales**:
  - Progreso de importación
  - Resultados detallados
  - Errores por producto

### 3. **Configuración del Servidor**

#### Modificaciones en `/home/ubuntu/server/_core/index.ts`:
- Servicio de archivos estáticos para `/uploads`
- Endpoints HTTP para upload:
  - `POST /api/import/upload` - Subir archivos
  - `POST /api/import/process` - Procesar importación

---

## 📝 Formato del Archivo Excel

### Columnas Requeridas:

| Columna | Tipo | Obligatorio | Descripción | Ejemplo |
|---------|------|-------------|-------------|---------|
| **SKU** | Texto | ✅ Sí | Código único del producto | `PROD-001` |
| **Nombre** | Texto | ✅ Sí | Nombre del producto | `Laptop HP 15"` |
| **Descripción** | Texto | ❌ No | Descripción detallada | `Laptop con procesador Intel i5...` |
| **Categoría** | Texto | ❌ No | Categoría del producto | `Electrónica` |
| **Precio** | Número | ✅ Sí | Precio base del producto | `899.99` |
| **Stock** | Número | ✅ Sí | Cantidad en inventario | `50` |
| **Imagen** | Texto | ❌ No | Nombre del archivo de imagen | `PROD-001.jpg` |

### Ejemplo de datos:

```
SKU         | Nombre              | Descripción                    | Categoría    | Precio | Stock | Imagen
------------|---------------------|--------------------------------|--------------|--------|-------|---------------
PROD-001    | Laptop HP 15"       | Laptop con procesador Intel i5 | Electrónica  | 899.99 | 50    | PROD-001.jpg
PROD-002    | Mouse Logitech      | Mouse inalámbrico ergonómico   | Accesorios   | 29.99  | 200   | PROD-002.jpg
PROD-003    | Teclado Mecánico    | Teclado RGB con switches azules| Accesorios   | 79.99  | 100   | PROD-003.jpg
```

---

## 🖼️ Manejo de Imágenes

### Asociación por Nombre de Archivo

El sistema asocia automáticamente las imágenes con los productos usando el **SKU** como referencia:

1. En el Excel, la columna "Imagen" contiene el **nombre del archivo** (ej: `PROD-001.jpg`)
2. Al subir las imágenes, el sistema busca el archivo que coincida con el nombre
3. Si encuentra coincidencia, optimiza la imagen y la asocia al producto

### Optimización Automática

Todas las imágenes subidas se optimizan automáticamente:

- **Tamaño**: 400x400 píxeles
- **Formato**: JPEG
- **Calidad**: 85%
- **Crop**: Inteligente (mantiene el centro de la imagen)

**Ejemplo:**
- Imagen original: `PROD-001.jpg` (2400x1600px, 3.5MB)
- Imagen optimizada: `prod_001_abc123.jpg` (400x400px, ~50KB)

### Formatos Soportados

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

---

## 🚀 Cómo Usar el Sistema

### Paso 1: Preparar el Archivo Excel

1. Accede al **Panel Admin** → **Importar**
2. Haz clic en **"Descargar Plantilla de Excel"**
3. Llena la plantilla con los datos de tus productos
4. En la columna "Imagen", coloca el nombre del archivo de imagen correspondiente

### Paso 2: Preparar las Imágenes

1. Prepara las imágenes de tus productos
2. **Nombra cada imagen igual que el valor en la columna "Imagen" del Excel**
3. Las imágenes pueden ser de cualquier tamaño (se optimizarán automáticamente)

### Paso 3: Importar

1. En el panel de importación, selecciona el **archivo Excel**
2. Selecciona las **imágenes** (puedes seleccionar múltiples archivos)
3. Haz clic en **"Importar Productos"**
4. Espera a que termine el proceso

### Paso 4: Verificar Resultados

El sistema mostrará:
- ✅ **Productos importados exitosamente**
- ❌ **Productos con errores** (con descripción del error)
- 📊 **Estadísticas** (total importados, fallidos, imágenes procesadas)

---

## 🔧 Arquitectura Técnica

### Flujo de Importación

```
1. Usuario sube Excel + Imágenes
   ↓
2. Backend recibe archivos (upload-handler.ts)
   ↓
3. Procesa Excel (import-service.ts)
   - Lee filas
   - Valida datos
   ↓
4. Optimiza imágenes (image-optimizer.ts)
   - Redimensiona a 400x400px
   - Guarda en /public/uploads/products/
   ↓
5. Crea productos en DB (db.ts)
   - Inserta productos
   - Asocia imágenes optimizadas
   ↓
6. Retorna resultados al frontend
   - Productos importados
   - Errores por fila
```

### Dependencias Instaladas

```json
{
  "sharp": "^0.33.5",        // Optimización de imágenes
  "xlsx": "^0.18.5",         // Lectura de Excel
  "multer": "^1.4.5-lts.1",  // Upload de archivos
  "@types/multer": "^1.4.12" // Tipos TypeScript
}
```

### Endpoints API

#### 1. Upload de Archivos
```
POST /api/import/upload
Content-Type: multipart/form-data

Fields:
  - excel: File (Excel file)
  - images: File[] (Image files)

Response:
{
  "success": true,
  "excelPath": "/tmp/uploads/abc123_productos.xlsx",
  "imagesPath": "/tmp/uploads/images_xyz789",
  "imagesCount": 10
}
```

#### 2. Procesar Importación
```
POST /api/import/process
Content-Type: application/json

Body:
{
  "excelPath": "/tmp/uploads/abc123_productos.xlsx",
  "imagesPath": "/tmp/uploads/images_xyz789"
}

Response:
{
  "success": true,
  "imported": 8,
  "failed": 2,
  "errors": [
    { "row": 5, "error": "SKU duplicado" },
    { "row": 9, "error": "Precio inválido" }
  ],
  "products": [...]
}
```

---

## 📂 Estructura de Archivos

```
/home/ubuntu/
├── server/
│   ├── image-optimizer.ts      # Servicio de optimización
│   ├── import-service.ts       # Servicio de importación
│   ├── upload-handler.ts       # Manejador HTTP
│   ├── import-router.ts        # Router tRPC
│   └── _core/
│       └── index.ts            # Configuración de endpoints
├── client/
│   └── src/
│       ├── components/
│       │   └── ProductImport.tsx  # Componente de importación
│       └── pages/
│           └── AdminPanel.tsx     # Panel con pestaña Importar
├── public/
│   └── uploads/
│       └── products/           # Imágenes optimizadas
└── .env                        # Variables de entorno
```

---

## 🧪 Archivos de Prueba

Se han creado archivos de ejemplo para probar el sistema:

- **Excel**: `/home/ubuntu/productos_ejemplo.xlsx`
  - 3 productos de prueba
  - Columnas completas
  - Referencias a imágenes

- **Imágenes**: 
  - `/home/ubuntu/TEST-001.jpg` (800x800px)
  - `/home/ubuntu/TEST-002.jpg` (800x800px)
  - `/home/ubuntu/TEST-003.jpg` (800x800px)

### Probar la Importación

1. Accede a http://localhost:3003/admin
2. Ve a la pestaña **"Importar"**
3. Sube `productos_ejemplo.xlsx`
4. Sube las imágenes `TEST-001.jpg`, `TEST-002.jpg`, `TEST-003.jpg`
5. Haz clic en **"Importar Productos"**

---

## ⚙️ Configuración

### Variables de Entorno

Asegúrate de que estas variables estén configuradas en `/home/ubuntu/.env`:

```env
# Base de datos
DATABASE_URL=mysql://root@localhost:3306/b2b_store
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=b2b_store

# JWT para autenticación
JWT_SECRET=b2b_store_secret_key_2024_production_...
```

### Directorios Requeridos

```bash
# Directorio para uploads temporales
mkdir -p /tmp/uploads

# Directorio para imágenes optimizadas
mkdir -p /home/ubuntu/public/uploads/products
```

---

## 🐛 Manejo de Errores

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Excel file is required" | No se subió archivo Excel | Selecciona un archivo Excel antes de importar |
| "SKU duplicado" | El SKU ya existe en la base de datos | Usa un SKU diferente o actualiza el producto existente |
| "Precio inválido" | El precio no es un número válido | Verifica que el precio sea un número (ej: 99.99) |
| "Stock inválido" | El stock no es un número entero | Verifica que el stock sea un número entero (ej: 100) |
| "Imagen no encontrada" | La imagen especificada no se subió | Verifica que el nombre del archivo coincida exactamente |

### Validaciones

El sistema valida automáticamente:
- ✅ SKU único
- ✅ Nombre no vacío
- ✅ Precio numérico positivo
- ✅ Stock numérico entero no negativo
- ✅ Formato de imagen válido

---

## 📊 Resultados de Importación

Después de importar, el sistema muestra:

### Estadísticas
- **Total de productos procesados**
- **Productos importados exitosamente**
- **Productos con errores**
- **Imágenes optimizadas**

### Detalles por Producto
- ✅ **Éxito**: SKU, nombre, precio, stock
- ❌ **Error**: Número de fila, descripción del error

### Ejemplo de Resultado

```
✅ Importación Completada

📊 Estadísticas:
  - Total procesados: 10
  - Importados: 8
  - Fallidos: 2
  - Imágenes optimizadas: 7

✅ Productos Importados:
  1. PROD-001 - Laptop HP 15" ($899.99)
  2. PROD-002 - Mouse Logitech ($29.99)
  ...

❌ Errores:
  - Fila 5: SKU duplicado (PROD-003)
  - Fila 9: Precio inválido (debe ser un número)
```

---

## 🎯 Próximos Pasos Recomendados

1. **Agregar soporte para variantes**:
   - Importar productos con múltiples variantes desde Excel
   - Columnas adicionales: Color, Talla, etc.

2. **Importación de precios por rol**:
   - Columnas para precio distribuidor, revendedor, etc.
   - Importación de tabla `rolePricing`

3. **Actualización de productos existentes**:
   - Opción para actualizar en lugar de crear
   - Modo "upsert" (crear o actualizar)

4. **Validación avanzada**:
   - Verificar que las categorías existan
   - Validar formato de SKU
   - Límites de precio y stock

5. **Historial de importaciones**:
   - Guardar registro de cada importación
   - Permitir revertir importaciones

---

## 📞 Soporte

Para más información o soporte, contacta al equipo de desarrollo.

---

**Fecha de implementación**: 20 de Octubre, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Completado y funcional

