# Tienda B2B - Cambios Recientes

## Fecha: 26 de Octubre 2025

### Cambios Implementados

#### 1. Precios Diferenciados para Variantes de Productos
- **Descripción**: Las variantes de productos ahora soportan tres tipos de precios (ciudad, interior, especial) igual que los productos simples.
- **Archivos modificados**:
  - `drizzle/schema.ts`: Agregadas columnas `precioCiudad`, `precioInterior`, `precioEspecial` a `productVariants`
  - `server/db.ts`: Actualizada función `getProductVariants` para devolver los tres precios
  - `server/routers.ts`: Actualizada lógica de carrito para usar precio correcto según tipo de usuario
  - `client/src/components/ProductVariantsModal.tsx`: Agregada función `getVariantPrice` para seleccionar precio según tipo de usuario
  - `server/import-excel-service.ts`: Actualizada importación de Excel para guardar precios de variantes

#### 2. Campo GPS Location en Usuarios
- **Descripción**: Agregado campo para almacenar ubicación GPS de clientes.
- **Archivos modificados**:
  - `drizzle/schema.ts`: Agregada columna `gpsLocation` a tabla `users`
  - `server/db-users.ts`: Incluido `gpsLocation` en SELECT de `listUsersWithStats`
  - `client/src/pages/admin/Users.tsx`: Agregado campo GPS en formulario de edición
  - `client/src/pages/vendedor/VendedorClientes.tsx`: Agregado campo GPS con botón de captura automática
  - `server/routers.ts`: Actualizado `createClient` para aceptar `gpsLocation`

#### 3. Correcciones de Errores
- **Validaciones de Base de Datos**: Agregadas validaciones `if (!db)` en múltiples endpoints para evitar errores cuando la base de datos no está disponible
- **Campos Faltantes en Usuarios**: Agregados campos `address`, `agentNumber`, `clientNumber`, etc. al SELECT de usuarios

### Instrucciones de Instalación

#### 1. Extraer el archivo ZIP
```bash
unzip tienda-b2b-20251026-171049.zip
cd tienda-b2b
```

#### 2. Instalar dependencias
```bash
pnpm install
```

#### 3. Aplicar cambios en la base de datos
```bash
mysql -u usuario -p nombre_base_datos < database_changes.sql
```

O ejecutar manualmente los comandos SQL del archivo `database_changes.sql`.

#### 4. Configurar variables de entorno
Asegúrate de que el archivo `.env` tenga todas las variables necesarias:
- `DATABASE_URL`: URL de conexión a MySQL
- `JWT_SECRET`: Secret para tokens JWT
- Otras variables según tu configuración

#### 5. Iniciar el servidor de desarrollo
```bash
pnpm dev
```

### Archivos Importantes

- `database_changes.sql`: Script SQL con todos los cambios en la base de datos
- `todo.md`: Lista de tareas completadas y pendientes
- `README_CAMBIOS.md`: Este archivo con documentación de cambios

### Notas Técnicas

#### Precios de Variantes
Los precios de las variantes se guardan en las columnas:
- `precioCiudad`: Precio para clientes tipo "ciudad"
- `precioInterior`: Precio para clientes tipo "interior"
- `precioEspecial`: Precio para clientes tipo "especial"

El sistema selecciona automáticamente el precio correcto según el `priceType` del usuario.

#### Ubicación GPS
El campo `gpsLocation` almacena las coordenadas en formato "latitud,longitud" (ej: "-25.2637,-57.5759").

En el formulario de vendedor, hay un botón "📍 Capturar" que usa la API de geolocalización del navegador para obtener automáticamente la ubicación actual.

### Soporte

Para cualquier consulta o problema, contactar al equipo de desarrollo.
