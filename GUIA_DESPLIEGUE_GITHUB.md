# Guía de Despliegue: Tienda B2B desde GitHub

## Información del Repositorio
- **URL**: https://github.com/Kamchion/manus-store
- **Token de acceso**: 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
- **Proyecto**: Tienda B2B Imporkam

## Pasos para Desplegar desde Cero

### 1. Clonar el Repositorio
```bash
cd /home/ubuntu
rm -rf tienda-b2b
git clone https://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@github.com/Kamchion/manus-store.git tienda-b2b
cd tienda-b2b
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Sincronizar Schema de Base de Datos
```bash
pnpm drizzle-kit pull
```

### 4. Corregir Importaciones en schema.ts

**Archivo**: `/home/ubuntu/tienda-b2b/drizzle/schema.ts`

**Línea 1** - Agregar tipos faltantes:
```typescript
import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, varchar, text, datetime, decimal, int, tinyint, timestamp, mysqlEnum, unique, index } from "drizzle-orm/mysql-core"
```

**Tipos que DEBEN estar importados**:
- `tinyint` - para campos booleanos (isActive, etc.)
- `timestamp` - para fechas (createdAt, updatedAt, etc.)
- `mysqlEnum` - para campos enum (role, status, etc.)

### 5. Comentar Funciones Problemáticas en db.ts

**Archivo**: `/home/ubuntu/tienda-b2b/server/db.ts`

**Comentar importación** (línea ~16):
```typescript
// quantityDiscountTiers,
```

**Comentar funciones** (líneas ~1038-1076):
```typescript
// export async function createQuantityDiscountTiers(...) { ... }
// export async function getQuantityDiscountTiers(...) { ... }
```

### 6. Corregir upload-handler.ts

**Archivo**: `/home/ubuntu/tienda-b2b/server/upload-handler.ts`

**Línea ~132** - Cambiar:
```typescript
console.log(`\n✅ Import complete: ${results.created} created, ${results.updated} updated`);
```

**Líneas ~138-139** - Cambiar:
```typescript
created: 0,
updated: 0,
```

### 7. Comentar Referencias en routers.ts

**Archivo**: `/home/ubuntu/tienda-b2b/server/routers.ts`

**Línea ~35** - Comentar importación:
```typescript
// createQuantityDiscountTiers,
```

**Líneas ~642-644** - Comentar uso:
```typescript
// if (input.promotionType === "quantity_discount" && input.tiers && input.tiers.length > 0) {
//   await createQuantityDiscountTiers(promotionId, input.tiers);
// }
```

### 8. Iniciar el Servidor

**NO usar webdev_restart_server**, usar directamente:
```bash
cd /home/ubuntu/tienda-b2b
pnpm dev > /tmp/server.log 2>&1 &
```

### 9. Verificar que Funciona
```bash
sleep 15
tail -20 /tmp/server.log
# Debe mostrar: "Server running on http://localhost:3000/"
```

### 10. Acceder a la Aplicación
URL: https://3000-{sandbox-id}.manusvm.computer

## Problemas Comunes y Soluciones

### Error: "tinyint is not defined"
**Solución**: Agregar `tinyint` a las importaciones en schema.ts (ver paso 4)

### Error: "timestamp is not defined"
**Solución**: Agregar `timestamp` a las importaciones en schema.ts (ver paso 4)

### Error: "createQuantityDiscountTiers not found"
**Solución**: Comentar referencias en db.ts y routers.ts (ver pasos 5 y 7)

### Error: "Property 'imported' does not exist"
**Solución**: Cambiar a `created` y `updated` en upload-handler.ts (ver paso 6)

### Servidor no arranca
**Solución**: 
1. Matar procesos: `pkill -9 -f "tsx.*server"`
2. Revisar logs: `tail -50 /tmp/server.log`
3. Corregir error mostrado
4. Reiniciar: `cd /home/ubuntu/tienda-b2b && pnpm dev > /tmp/server.log 2>&1 &`

## Notas Importantes

1. **NO usar webdev tools** - El proyecto funciona mejor ejecutándose directamente
2. **NO modificar el schema manualmente** - Siempre usar `drizzle-kit pull` primero
3. **Verificar importaciones** - Después de `drizzle-kit pull`, siempre revisar que estén todos los tipos importados
4. **Guardar logs** - Siempre redirigir output a `/tmp/server.log` para debugging

## Credenciales de Base de Datos

Las credenciales están en las variables de entorno del proyecto Manus:
- DATABASE_URL (auto-inyectada)
- Conexión manejada por Drizzle ORM

## Estado Actual

- ✅ Servidor funcionando en puerto 3000
- ✅ Base de datos conectada (12 tablas, 119 columnas)
- ✅ Frontend cargando correctamente
- ✅ Login funcional
- ✅ Importación de Excel funcional (confirmado por usuario)

## Última Actualización
23 de octubre de 2025 - 17:52 GMT-5

