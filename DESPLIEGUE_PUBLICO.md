# Despliegue Público - IMPORKAM Tienda B2B

## 🌐 URL de Acceso Público

**URL del Sitio**: https://3000-ik70jpzbju9bx7wh7titg-42845719.manusvm.computer

**Estado**: ✅ Activo y funcionando

**Fecha de Despliegue**: 22 de Octubre, 2025

## 🔐 Credenciales de Acceso

### Usuario Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Administrador
- **Permisos**: Acceso completo al panel de administración

### Usuario Cliente de Prueba
- **Usuario**: `cliente1`
- **Contraseña**: `cliente123`
- **Rol**: Cliente
- **Tipo de Precio**: Ciudad

### Usuario Vendedor
- **Usuario**: `vendedor1`
- **Contraseña**: `vendedor123`
- **Rol**: Vendedor
- **Permisos**: Gestión de clientes y pedidos

## 📋 Funcionalidades Disponibles

### Para Clientes
1. **Catálogo de Productos**
   - Búsqueda y filtrado
   - Precios según rol
   - Productos con variantes (tallas, colores)
   - Vista optimizada para móvil

2. **Carrito de Compras**
   - Agregar/eliminar productos
   - Editar cantidades
   - Agregar notas al pedido
   - Cálculo automático de impuestos

3. **Gestión de Pedidos**
   - Ver historial de pedidos
   - Detalles de cada pedido
   - Estado de pedidos

### Para Administradores
1. **Panel de Administración**
   - Gestión de productos
   - Gestión de usuarios/clientes
   - Configuración de precios por tipo
   - Gestión de promociones
   - Visualización de pedidos

2. **Configuración del Sistema** ⭐ NUEVO
   - **Tasa de Impuesto**: Configurable de 0-100%
   - **Moneda**: USD, PYG, EUR, BRL, ARS
   - **Símbolo de Moneda**: Personalizable
   - **Zona Horaria**: 10 opciones de América Latina
   - **Información de Tienda**: Nombre, teléfono, dirección
   - **Emails**: Configuración de notificaciones
   - **Pop-ups**: Anuncios al iniciar sesión

3. **Importación de Datos**
   - Importar productos desde Excel
   - Importar clientes desde Excel
   - Plantillas descargables

### Para Vendedores
1. **Dashboard de Ventas**
   - Gestión de clientes asignados
   - Visualización de pedidos
   - Estadísticas de ventas

## 🎨 Características Destacadas

### Sistema de Configuración Expandido
- ✅ Tasa de impuesto dinámica (no más 10% fijo)
- ✅ Soporte multi-moneda
- ✅ Formateo automático de precios
- ✅ Configuración centralizada

### Diseño Responsive
- ✅ Optimizado para móviles
- ✅ Interfaz compacta y eficiente
- ✅ Navegación intuitiva

### Sistema de Variantes
- ✅ Productos con múltiples variantes
- ✅ Modal de selección con tabla
- ✅ Control de stock por variante

### Precios Dinámicos
- ✅ Precios según tipo de cliente (ciudad, interior, especial)
- ✅ Promociones y descuentos
- ✅ Cantidades mínimas por tipo

## 🧪 Cómo Probar

### 1. Acceso como Administrador

1. Ir a: https://3000-ik70jpzbju9bx7wh7titg-42845719.manusvm.computer/login
2. Ingresar credenciales de admin
3. Explorar el panel de administración
4. Ir a **Configuración** para ver el nuevo sistema de configuración
5. Modificar tasa de impuesto, moneda, etc.
6. Ver cómo los cambios se reflejan en toda la aplicación

### 2. Acceso como Cliente

1. Cerrar sesión (si está logueado como admin)
2. Ingresar como `cliente1`
3. Explorar el catálogo de productos
4. Agregar productos al carrito
5. Ver cómo se calcula el impuesto según la configuración
6. Completar un pedido
7. Ver el historial de pedidos

### 3. Probar Configuración del Sistema

1. Login como admin
2. Ir a **Panel de Administración** → **Configuración**
3. Cambiar **Tasa de Impuesto** de 10% a 15%
4. Cambiar **Moneda** a PYG (Guaraní Paraguayo)
5. Cambiar **Símbolo** a "Gs."
6. Guardar configuración
7. Ir al catálogo como cliente
8. Verificar que los precios ahora muestran "Gs." en lugar de "$"
9. Agregar productos al carrito
10. Verificar que el impuesto se calcula al 15% en lugar de 10%

## 🔧 Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + tRPC
- **Base de Datos**: MySQL + Drizzle ORM
- **Autenticación**: JWT con cookies
- **UI Components**: Radix UI + Shadcn/ui
- **Notificaciones**: Sonner (toast)

## 📊 Datos de Prueba

El sistema incluye datos de prueba:
- ✅ 30+ productos con variantes
- ✅ 3 usuarios (admin, cliente, vendedor)
- ✅ Configuraciones del sistema
- ✅ Precios por tipo de cliente
- ✅ Promociones de ejemplo

## ⚠️ Notas Importantes

### Persistencia de Datos
- Los datos se almacenan en MySQL
- Las configuraciones persisten entre sesiones
- Los cambios realizados son permanentes en esta instancia

### Limitaciones del Despliegue Temporal
- Esta URL es temporal y estará disponible mientras la sesión esté activa
- Para un despliegue permanente, se recomienda usar servicios como:
  - **Vercel** (Frontend)
  - **Railway** o **Render** (Backend + Base de datos)
  - **PlanetScale** o **AWS RDS** (Base de datos MySQL)

### Seguridad
- En producción, cambiar todas las credenciales
- Usar variables de entorno seguras
- Implementar HTTPS
- Configurar CORS apropiadamente
- Implementar rate limiting

## 🚀 Próximos Pasos para Producción

1. **Configurar Dominio Personalizado**
   - Registrar dominio
   - Configurar DNS
   - Implementar SSL/TLS

2. **Optimizar Base de Datos**
   - Configurar backups automáticos
   - Implementar índices
   - Optimizar queries

3. **Implementar Monitoreo**
   - Logs centralizados
   - Alertas de errores
   - Métricas de rendimiento

4. **Mejorar Seguridad**
   - Autenticación de dos factores
   - Encriptación de datos sensibles
   - Auditoría de seguridad

5. **Optimizar Rendimiento**
   - CDN para assets estáticos
   - Caché de base de datos
   - Compresión de respuestas

## 📞 Soporte

Para reportar problemas o sugerencias durante las pruebas, documentar:
- URL donde ocurrió el problema
- Usuario con el que estaba logueado
- Pasos para reproducir
- Capturas de pantalla si es posible

## 📄 Documentación Adicional

- `README.md` - Información general del proyecto
- `SISTEMA_CONFIGURACION_EXPANDIDO.md` - Guía técnica del sistema de configuración
- `RESUMEN_SESION_CONFIGURACION.md` - Resumen de cambios implementados
- `INSTRUCCIONES_INSTALACION.md` - Guía de instalación local

---

**Proyecto**: IMPORKAM Tienda B2B  
**Versión**: 1.0.0 (con sistema de configuración expandido)  
**Último Commit**: 8a0b3d0  
**Fecha**: 22 de Octubre, 2025

