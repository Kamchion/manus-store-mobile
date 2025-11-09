# Importación y Exportación de Clientes

## Descripción

Se ha implementado un sistema completo de importación y exportación de clientes en el panel de administración de Manus Store. Esta funcionalidad permite a los administradores cargar y descargar información de clientes de forma masiva mediante archivos Excel.

## Características Implementadas

### 1. Importación de Clientes

**Ubicación**: Panel de Administración → Pestaña "Importar" → Botón "Importar Clientes"

**Formato del Archivo Excel**: 9 columnas (A-I)

| Columna | Campo | Descripción | Ejemplo |
|---------|-------|-------------|---------|
| A | ID | Número de cliente o agente | CLI-001, VEN-15 |
| B | Rol | cliente, vendedor, operador, administrador | cliente |
| C | Nombre | Nombre de la empresa/negocio | Distribuidora El Sol S.A. |
| D | Dirección | Dirección completa | Av. 18 de Julio 1234, Montevideo |
| E | Correo | Email (opcional) | contacto@elsol.com.uy |
| F | Persona de Contacto | Nombre del contacto | Juan Pérez |
| G | Teléfono | Número de teléfono | +598 99 123 456 |
| H | Agente Asignado | ID del vendedor (solo para clientes) | VEN-001 |
| I | Precio Asignado | ciudad, interior, especial | ciudad |

**Funcionalidad**:
- Crea nuevos clientes si no existen
- Actualiza clientes existentes basándose en el ID
- Valida roles y tipos de precio
- Genera usernames únicos automáticamente
- Asigna contraseña por defecto: `123456`
- Muestra errores detallados por fila

### 2. Exportación de Clientes

**Ubicación**: Panel de Administración → Pestaña "Importar" → Botón "Exportar Clientes a Excel"

**Funcionalidad**:
- Exporta todos los clientes existentes en la base de datos
- Genera archivo Excel con el mismo formato de 9 columnas
- Nombre del archivo: `clientes_YYYY-MM-DD.xlsx`
- Puede usarse como plantilla o para respaldo

### 3. Plantilla de Ejemplo

**Ubicación**: Panel de Administración → Pestaña "Importar" → Botón "Descargar Plantilla CSV"

**Contenido**:
- Archivo CSV con ejemplos de clientes
- Incluye 3 clientes de ejemplo
- Formato correcto para importación

## Archivos Creados/Modificados

### Backend

1. **`server/import-clients-service.ts`** (ya existía, corregido)
   - Servicio de importación de clientes desde Excel
   - Servicio de exportación de clientes a Excel
   - Validación de roles y tipos de precio
   - Generación de usernames únicos

2. **`server/client-upload-handler.ts`** (nuevo)
   - Handler para importación de clientes
   - Handler para exportación de clientes
   - Gestión de archivos temporales

3. **`server/_core/index.ts`** (modificado)
   - Agregadas rutas `/api/import/clients` (POST)
   - Agregadas rutas `/api/import/clients/export` (GET)

4. **`server/upload-handler.ts`** (modificado)
   - Actualizado fileFilter para aceptar archivos .xlsx con MIME type `application/octet-stream`
   - Validación por extensión de archivo

### Frontend

1. **`client/src/components/ClientImport.tsx`** (ya existía)
   - Componente de importación/exportación de clientes
   - Tabla descriptiva de las 9 columnas
   - Botones de descarga de plantilla y exportación
   - Formulario de carga de archivo Excel

2. **`client/src/pages/AdminPanel.tsx`** (modificado)
   - Agregado componente `ImportTab`
   - Selector entre importación de productos y clientes
   - Integración de `ClientImport` component

### Archivos de Ejemplo

1. **`clientes_ejemplo.xlsx`**
   - Archivo Excel de ejemplo con 7 clientes
   - 4 clientes y 3 vendedores
   - Formato correcto de 9 columnas

## Uso

### Importar Clientes

1. Acceder al Panel de Administración
2. Ir a la pestaña "Importar"
3. Seleccionar "Importar Clientes"
4. Descargar la plantilla CSV (opcional)
5. Completar el archivo Excel con los datos
6. Subir el archivo
7. Revisar los resultados de la importación

### Exportar Clientes

1. Acceder al Panel de Administración
2. Ir a la pestaña "Importar"
3. Seleccionar "Importar Clientes"
4. Hacer clic en "Exportar Clientes a Excel"
5. El archivo se descargará automáticamente

## Validaciones

- **Nombre**: Obligatorio
- **Rol**: Debe ser uno de: cliente, vendedor, operador, administrador
- **Precio Asignado**: Debe ser uno de: ciudad, interior, especial
- **Correo**: Formato de email válido (opcional)
- **ID**: Recomendado para evitar duplicados

## Notas Importantes

1. **Contraseña por Defecto**: Todos los usuarios nuevos tienen la contraseña `123456` y deben cambiarla después del primer login.

2. **Actualización de Usuarios**: Si un cliente con el mismo ID ya existe, se actualizará su información en lugar de crear uno nuevo.

3. **Generación de Username**: El sistema genera automáticamente usernames únicos basados en el nombre de la empresa.

4. **Roles**:
   - **cliente**: Usuario que compra productos
   - **vendedor**: Agente de ventas que gestiona clientes
   - **operador**: Usuario con permisos de gestión
   - **administrador**: Usuario con permisos completos

5. **Tipos de Precio**:
   - **ciudad**: Precio para clientes de ciudad
   - **interior**: Precio para clientes del interior
   - **especial**: Precio especial para clientes VIP

## Pruebas Realizadas

✅ Importación de 7 clientes desde Excel
✅ Exportación de todos los clientes a Excel
✅ Validación de formato de archivo
✅ Validación de roles y tipos de precio
✅ Actualización de clientes existentes
✅ Generación de usernames únicos

## API Endpoints

### POST `/api/import/clients`
- **Descripción**: Importa clientes desde un archivo Excel
- **Content-Type**: `multipart/form-data`
- **Parámetros**: 
  - `excel`: Archivo Excel (.xlsx, .xls, .csv)
- **Respuesta**:
```json
{
  "success": true,
  "created": 0,
  "updated": 7,
  "errors": [],
  "total": 7
}
```

### GET `/api/import/clients/export`
- **Descripción**: Exporta todos los clientes a un archivo Excel
- **Respuesta**: Archivo Excel binario
- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

## Próximos Pasos

- [ ] Agregar validación de GPS location
- [ ] Implementar importación de imágenes de perfil
- [ ] Agregar filtros de exportación (por rol, tipo de precio, etc.)
- [ ] Implementar log de auditoría de importaciones
- [ ] Agregar notificaciones por email a usuarios nuevos

## Autor

Implementado el 21 de octubre de 2025

