# TODO - Tienda B2B IMPORKAM

## ✅ Estado Actual del Proyecto

**Fecha:** 28 de Octubre, 2025  
**Versión:** Restaurada desde GitHub (https://github.com/Kamchion/manus-store)  
**Servidor:** Funcionando correctamente en https://3000-imct2365ykn38hyhvtj3c-6d7b15e5.manusvm.computer

### Funcionalidades Implementadas

- [x] Sistema completo de productos con variantes
- [x] Precios diferenciados por tipo (ciudad, interior, especial)
- [x] Gestión de usuarios y roles (administrador, operador, vendedor, cliente)
- [x] Carrito de compras con campos personalizados
- [x] Sistema de pedidos
- [x] Generación de PDFs con imágenes
- [x] Generación de Excel
- [x] Importación de productos desde Excel
- [x] Importación de clientes desde Excel
- [x] Panel de administración completo
- [x] Panel de vendedor
- [x] Configuración SMTP para envío de emails
- [x] Captura de ubicación GPS en formularios

### Tecnologías

- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js 22 + Express + tRPC
- **Base de Datos:** MySQL 8.0
- **ORM:** Drizzle
- **Generación de Reportes:** PDFKit + ExcelJS
- **Email:** Nodemailer

## 🔄 Pendientes (Solicitado por el Usuario)

### 1. Configuración Visual de PDFs
- [ ] Crear interfaz en Panel Admin > Configuración > Reportes
- [ ] Permitir personalizar nombres de columnas del header
- [ ] Permitir configurar espaciado entre líneas
- [ ] Permitir ajustar tamaños de fuente
- [ ] Guardar configuración en base de datos (tabla systemConfig)
- [ ] Aplicar configuración al generar PDFs

### 2. Configuración Visual de Excel
- [ ] Crear interfaz en Panel Admin > Configuración > Reportes
- [ ] Permitir seleccionar información del header (vendedor, cliente, dirección, notas)
- [ ] Permitir activar/desactivar columnas de la tabla
- [ ] Guardar configuración en base de datos
- [ ] Aplicar configuración al generar Excel

### 3. Corrección de Precios de Variantes
- [ ] Modificar código de importación de Excel
- [ ] Guardar precios de variantes en tabla pricingByType
- [ ] Usar ID de variante para buscar precios (no ID del padre)
- [ ] Probar con reimportación de productos

## 📝 Notas Importantes

- Las imágenes de productos están en `/public/uploads/products/` (no se suben a GitHub por .gitignore)
- El proyecto está conectado al repositorio GitHub del usuario
- Todos los cambios se pueden hacer push al repositorio
- La base de datos debe configurarse con las variables de entorno correctas


