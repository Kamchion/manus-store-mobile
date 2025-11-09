# Guía de Plantillas de Importación

## 📋 Archivos de Plantillas Disponibles

Se han creado dos plantillas completas con ejemplos detallados para facilitar la importación de datos:

1. **PLANTILLA_CLIENTES_COMPLETA.xlsx** - Plantilla para importar clientes
2. **PLANTILLA_PRODUCTOS_COMPLETA.xlsx** - Plantilla para importar productos

---

## 👥 PLANTILLA DE CLIENTES

### Archivo: `PLANTILLA_CLIENTES_COMPLETA.xlsx`

### Estructura: 9 Columnas (A-I)

| Columna | Campo | Descripción | Ejemplo |
|---------|-------|-------------|---------|
| **A** | ID | Identificador único | CLI-001, VEN-001 |
| **B** | Rol | Tipo de usuario | cliente, vendedor, operador, administrador |
| **C** | Nombre | Nombre de la empresa | Supermercado Don Pedro |
| **D** | Dirección | Dirección completa | Av. 18 de Julio 1234, Montevideo |
| **E** | Correo | Email (opcional) | contacto@donpedro.com.uy |
| **F** | Persona de Contacto | Nombre del contacto | Pedro Rodríguez |
| **G** | Teléfono | Número de teléfono | +598 99 123 456 |
| **H** | Agente Asignado | ID del vendedor | VEN-001 |
| **I** | Precio Asignado | Tipo de precio | ciudad, interior, especial |

### Ejemplos Incluidos (13 registros):

#### 8 Clientes de Ejemplo:
- CLI-001: Supermercado Don Pedro (Ciudad)
- CLI-002: Distribuidora La Estrella S.A. (Interior)
- CLI-003: Comercial El Sol Ltda. (Especial)
- CLI-004: Tienda La Luna (Ciudad)
- CLI-005: Mayorista Los Andes (Interior)
- CLI-006: Distribuidora Norte S.R.L. (Interior)
- CLI-007: Comercial Sur (Ciudad)
- CLI-008: Supermercado Central (Especial)

#### 3 Vendedores de Ejemplo:
- VEN-001: Vendedor Zona Norte
- VEN-002: Vendedor Zona Este
- VEN-003: Vendedor Zona Sur

#### 1 Operador y 1 Administrador:
- OPE-001: Operador Principal
- ADM-001: Administrador Sistema

### Hojas del Archivo:
1. **Clientes** - Datos de ejemplo
2. **Instrucciones** - Guía detallada de uso

### Validaciones:
- ✅ Nombre es obligatorio
- ✅ Rol debe ser: cliente, vendedor, operador o administrador
- ✅ Precio debe ser: ciudad, interior o especial
- ✅ Email debe tener formato válido (si se proporciona)

### Notas Importantes:
- **Contraseña por defecto**: 123456 (debe cambiarse en el primer login)
- **Actualización**: Si existe un cliente con el mismo ID, se actualiza
- **Creación**: Si no existe, se crea un nuevo cliente
- **Username**: Se genera automáticamente del nombre de la empresa

---

## 📦 PLANTILLA DE PRODUCTOS

### Archivo: `PLANTILLA_PRODUCTOS_COMPLETA.xlsx`

### Estructura: 18 Columnas (A-R)

| Col | Campo | Descripción | Ejemplo |
|-----|-------|-------------|---------|
| **A** | Orden | Orden en catálogo | A0001, B0002 |
| **B** | Categoría | Categoría principal | BATERIA, ROPA, ELECTRONICA |
| **C** | Subcategoría | Subcategoría | ALCALINA, REMERAS, SMARTPHONES |
| **D** | Código del Modelo | SKU padre (variantes) | REM-BAS-001 |
| **E** | SKU | Código único | BAT-AA-001, REM-BAS-001-BLK |
| **F** | Nombre | Nombre del producto | Batería Alcalina AA Pack x12 |
| **G** | Nombre Variante | Nombre de variante | Negro, Talla 38 |
| **H** | Dimensión | Tipo de variante | Color, Talla, Color/Capacidad |
| **I** | Línea 1 | Texto sobre cantidad | Mínimo 2 unidades |
| **J** | Cantidad Mínima | Cantidad mínima | 2, 3, 5 |
| **K** | Línea 2 | Texto en rojo | ¡Oferta especial! |
| **L** | Ubicación | Ubicación física | Almacén A-12 |
| **M** | Unidades/Caja | Unidades por caja | 96, 24, 12 |
| **N** | Visible | Mostrar en catálogo | TRUE, FALSE |
| **O** | Stock | Cantidad disponible | 150, 200, 80 |
| **P** | Precio Ciudad | Precio tipo ciudad | 2.50, 15.00, 45.00 |
| **Q** | Precio Interior | Precio tipo interior | 2.65, 15.50, 47.00 |
| **R** | Precio Especial | Precio tipo especial | 2.80, 16.00, 49.00 |

### Ejemplos Incluidos (20 productos):

#### 1️⃣ PRODUCTOS SIMPLES (7 productos)

**Baterías (3 productos):**
- BAT-AA-001: Batería Alcalina AA Pack x12
- BAT-AAA-001: Batería Alcalina AAA Pack x12
- BAT-REC-001: Batería Recargable AA 2400mAh x4

**Limpieza (2 productos):**
- LIM-DET-001: Detergente Líquido 5L
- LIM-DES-001: Desinfectante Multiuso 1L

**Papelería (2 productos):**
- PAP-CUA-001: Cuaderno Universitario 100 hojas
- PAP-LAP-001: Lápiz HB Caja x12

#### 2️⃣ PRODUCTOS CON VARIANTES (13 productos)

**Remeras - Variantes de Color (4 variantes):**
- Código del Modelo: **REM-BAS-001**
- Producto: Remera Básica Algodón
- Variantes:
  - REM-BAS-001-BLK: Negro
  - REM-BAS-001-WHT: Blanco
  - REM-BAS-001-BLU: Azul
  - REM-BAS-001-RED: Rojo
- Dimensión: **Color**

**Zapatillas - Variantes de Talla (5 variantes):**
- Código del Modelo: **ZAP-DEP-001**
- Producto: Zapatillas Deportivas Running
- Variantes:
  - ZAP-DEP-001-38: Talla 38
  - ZAP-DEP-001-39: Talla 39
  - ZAP-DEP-001-40: Talla 40
  - ZAP-DEP-001-41: Talla 41
  - ZAP-DEP-001-42: Talla 42
- Dimensión: **Talla**

**Smartphones - Variantes Múltiples (4 variantes):**
- Código del Modelo: **PHN-PRE-001**
- Producto: Smartphone Premium 6.5"
- Variantes:
  - PHN-PRE-001-BLK-128: Negro 128GB
  - PHN-PRE-001-BLK-256: Negro 256GB
  - PHN-PRE-001-WHT-128: Blanco 128GB
  - PHN-PRE-001-WHT-256: Blanco 256GB
- Dimensión: **Color/Capacidad**

### Hojas del Archivo:
1. **Productos** - Datos de ejemplo (20 productos)
2. **Instrucciones** - Guía detallada de uso
3. **Resumen** - Estadísticas de los productos incluidos

### Diferencias: Productos Simples vs Productos con Variantes

#### PRODUCTOS SIMPLES:
```
Columna D (Código del Modelo): [VACÍO]
Columna G (Nombre Variante):   [VACÍO]
Columna H (Dimensión):          [VACÍO]
```

**Ejemplo:**
```
A0001 | BATERIA | ALCALINA | [vacío] | BAT-AA-001 | Batería Alcalina AA Pack x12 | [vacío] | [vacío] | ...
```

#### PRODUCTOS CON VARIANTES:
```
Columna D (Código del Modelo): [MISMO PARA TODAS LAS VARIANTES]
Columna G (Nombre Variante):   [NOMBRE DE LA VARIANTE]
Columna H (Dimensión):          [TIPO DE VARIANTE]
```

**Ejemplo (Remera con 4 colores):**
```
B0001 | ROPA | REMERAS | REM-BAS-001 | REM-BAS-001-BLK | Remera Básica Algodón | Negro  | Color | ...
B0002 | ROPA | REMERAS | REM-BAS-001 | REM-BAS-001-WHT | Remera Básica Algodón | Blanco | Color | ...
B0003 | ROPA | REMERAS | REM-BAS-001 | REM-BAS-001-BLU | Remera Básica Algodón | Azul   | Color | ...
B0004 | ROPA | REMERAS | REM-BAS-001 | REM-BAS-001-RED | Remera Básica Algodón | Rojo   | Color | ...
```

### Validaciones:
- ✅ SKU es obligatorio y debe ser único
- ✅ Nombre es obligatorio
- ✅ Precios deben ser números positivos
- ✅ Stock debe ser un número
- ✅ Cantidad Mínima debe ser un número positivo
- ✅ Visible debe ser TRUE o FALSE

### Notas Importantes:
- **Actualización**: Si existe un producto con el mismo SKU, se actualiza
- **Creación**: Si no existe, se crea un nuevo producto
- **Variantes**: Se detectan automáticamente por el Código del Modelo
- **Imágenes**: Se pueden subir por separado con el nombre del SKU (ej: REM-BAS-001-BLK.jpg)

---

## 🚀 Cómo Usar las Plantillas

### Para Clientes:

1. Abrir `PLANTILLA_CLIENTES_COMPLETA.xlsx`
2. Ir a la hoja "Clientes"
3. Revisar los ejemplos (filas 2-14)
4. Eliminar los ejemplos o modificarlos según necesidad
5. Agregar tus propios clientes siguiendo el formato
6. Guardar el archivo
7. Ir al Panel de Administración → Importar → Importar Clientes
8. Subir el archivo

### Para Productos:

1. Abrir `PLANTILLA_PRODUCTOS_COMPLETA.xlsx`
2. Ir a la hoja "Productos"
3. Revisar los ejemplos:
   - Filas 2-8: Productos simples
   - Filas 9-12: Remeras con variantes de color
   - Filas 13-17: Zapatillas con variantes de talla
   - Filas 18-21: Smartphones con variantes múltiples
4. Eliminar los ejemplos o modificarlos según necesidad
5. Agregar tus propios productos siguiendo el formato
6. Para productos con variantes:
   - Usar el mismo "Código del Modelo" para todas las variantes
   - Completar "Nombre Variante" y "Dimensión"
7. Guardar el archivo
8. Ir al Panel de Administración → Importar → Importar Productos
9. Subir el archivo (y opcionalmente las imágenes)

---

## 💡 Consejos y Mejores Prácticas

### Para Clientes:

1. **IDs Únicos**: Usa un sistema consistente (CLI-001, CLI-002, VEN-001, etc.)
2. **Emails**: Aunque opcionales, son útiles para comunicación
3. **Agentes**: Asigna vendedores a clientes para mejor gestión
4. **Tipos de Precio**: Asigna el tipo correcto según la ubicación/categoría del cliente

### Para Productos:

1. **SKUs Únicos**: Usa un sistema consistente y descriptivo
2. **Código del Modelo**: Para variantes, usa el SKU base (sin variante)
3. **Nombres de Variantes**: Sé descriptivo (Negro, Talla 38, Negro 128GB)
4. **Precios**: Asegúrate de que Ciudad < Interior < Especial (o según tu estrategia)
5. **Stock**: Mantén actualizado para evitar sobreventa
6. **Imágenes**: Nombra las imágenes con el SKU exacto para auto-asignación

### Para Variantes:

1. **Consistencia**: Todas las variantes de un producto deben tener el mismo Código del Modelo
2. **SKUs Descriptivos**: Incluye la variante en el SKU (REM-BAS-001-BLK)
3. **Dimensión Clara**: Usa nombres descriptivos (Color, Talla, Color/Capacidad)
4. **Precios Iguales**: Normalmente las variantes tienen el mismo precio
5. **Stock Individual**: Cada variante tiene su propio stock

---

## 📊 Estadísticas de las Plantillas

### Plantilla de Clientes:
- **Total de registros**: 13
  - Clientes: 8
  - Vendedores: 3
  - Operadores: 1
  - Administradores: 1
- **Hojas**: 2 (Clientes, Instrucciones)
- **Tamaño**: ~8 KB

### Plantilla de Productos:
- **Total de productos**: 20
  - Productos simples: 7
  - Productos con variantes: 13
    - Remeras: 4 variantes de color
    - Zapatillas: 5 variantes de talla
    - Smartphones: 4 variantes múltiples
- **Hojas**: 3 (Productos, Instrucciones, Resumen)
- **Tamaño**: ~11 KB

---

## 🔗 Recursos Adicionales

- **Documentación Completa**: Ver `IMPORTACION_CLIENTES.md`
- **Resumen de Implementación**: Ver `RESUMEN_IMPORTACION_CLIENTES.md`
- **Repositorio GitHub**: https://github.com/Kamchion/manus-store

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo modificar las plantillas?**
R: Sí, pero mantén la estructura de columnas y el orden.

**P: ¿Qué pasa si dejo una columna vacía?**
R: Las columnas opcionales pueden dejarse vacías. Las obligatorias causarán error.

**P: ¿Puedo importar solo algunos productos/clientes?**
R: Sí, puedes importar desde 1 hasta miles de registros.

**P: ¿Se pueden importar imágenes?**
R: Sí, para productos puedes subir imágenes por separado con el nombre del SKU.

**P: ¿Qué pasa si hay un error en una fila?**
R: El sistema reportará el error pero continuará con las demás filas.

**P: ¿Puedo mezclar productos simples y con variantes?**
R: Sí, puedes tener ambos tipos en el mismo archivo.

---

**Fecha de creación**: 21 de octubre de 2025  
**Versión**: 1.0

