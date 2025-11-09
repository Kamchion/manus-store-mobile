# Comparación de Campos: Plantilla Excel vs Base de Datos

## Campos en la Plantilla de Importación Excel (18 columnas)

| Columna | Nombre en Excel | Campo en DB esperado | ¿Existe en DB? |
|---------|-----------------|---------------------|----------------|
| A | orden | displayOrder | ✅ SÍ |
| B | Categoría principal | category | ✅ SÍ |
| C | subcategoria | subcategory | ✅ SÍ |
| D | Código del modelo | parentSku | ✅ SÍ |
| E | Codigo del articulo | sku | ✅ SÍ |
| F | Descripcion | name | ✅ SÍ |
| G | Descripción del modelo | variantName | ✅ SÍ |
| H | Dimensión 1 | dimension | ✅ SÍ |
| I | linea1 | line1Text | ✅ SÍ |
| J | Cantidad minima | minQuantity | ✅ SÍ |
| K | linea2 | line2Text | ✅ SÍ |
| L | ItemUPC | location | ✅ SÍ |
| M | cant*cja | unitsPerBox | ✅ SÍ |
| N | Ocultar en catalogo | hideInCatalog | ✅ SÍ |
| O | STOCK | stock | ✅ SÍ |
| P | ciudad | (precio en pricingByType) | ✅ SÍ |
| Q | interior | (precio en pricingByType) | ✅ SÍ |
| R | especial | (precio en pricingByType) | ✅ SÍ |

## Campos en la Tabla `products` (22 columnas)

Basado en la consulta a la base de datos, la tabla products tiene 22 columnas.

### Mapeo Completo

**Campos principales**:
1. `id` - ID único del producto (auto-generado)
2. `sku` - Código del artículo (Columna E)
3. `name` - Descripción/Nombre (Columna F)
4. `category` - Categoría principal (Columna B)
5. `subcategory` - Subcategoría (Columna C)
6. `stock` - Stock disponible (Columna O)
7. `isActive` - Si el producto está activo
8. `createdAt` - Fecha de creación
9. `updatedAt` - Fecha de actualización

**Campos de variantes**:
10. `parentSku` - Código del modelo (Columna D)
11. `variantName` - Descripción del modelo (Columna G)
12. `dimension` - Dimensión 1 (Columna H)

**Campos de visualización**:
13. `displayOrder` - Orden (Columna A)
14. `line1Text` - linea1 (Columna I)
15. `line2Text` - linea2 (Columna K)
16. `hideInCatalog` - Ocultar en catálogo (Columna N)

**Campos de logística**:
17. `location` - ItemUPC/Ubicación (Columna L)
18. `unitsPerBox` - cant*cja (Columna M)
19. `minQuantity` - Cantidad mínima (Columna J)

**Campos de precios** (en tabla separada `pricingByType`):
- Precio ciudad (Columna P)
- Precio interior (Columna Q)
- Precio especial (Columna R)

## ✅ Conclusión

**TODOS los 18 campos de la plantilla Excel YA ESTÁN disponibles en la base de datos**:
- 15 campos directos en la tabla `products`
- 3 campos de precios en la tabla `pricingByType`

No hay campos faltantes. El sistema está completo y listo para importar todos los datos de la plantilla Excel.

## 📊 Estado Actual

✅ **Base de datos**: Todos los campos creados  
✅ **Schema Drizzle**: Sincronizado con la base de datos  
✅ **Servicio de importación**: Procesa las 18 columnas  
✅ **Documentación**: FORMATO_IMPORTACION_EXCEL.md completa  

## 🎯 Próximos Pasos

Si quieres verificar que la importación funciona correctamente con todos los campos:

1. Crear un archivo Excel de prueba con las 18 columnas
2. Importar el archivo usando el Panel Admin
3. Verificar que todos los campos se importen correctamente
4. Verificar que los productos se muestren correctamente en el catálogo

---

**Fecha**: 23 de Octubre, 2025  
**Versión**: 1.0.0

