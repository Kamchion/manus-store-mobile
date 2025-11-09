# Manus Store - Tienda B2B

Sistema completo de tienda B2B con gestión de productos, usuarios, importación masiva y diseño responsive.

## 🚀 Características

- ✅ **Catálogo de productos** con scroll infinito
- ✅ **Panel de administración** completo
- ✅ **Sistema de importación masiva** desde Excel con optimización automática de imágenes
- ✅ **Diseño responsive** optimizado para móvil, tablet y desktop
- ✅ **Gestión de usuarios** con roles (Admin, Distribuidor, Revendedor, Usuario)
- ✅ **Precios diferenciados** por rol de usuario
- ✅ **Carrito de compras** funcional
- ✅ **Sistema de pedidos**
- ✅ **Productos con variantes** (tallas, colores, capacidades)

## 🛠️ Tecnologías

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- tRPC Client
- Wouter (routing)

### Backend
- Node.js
- Express
- tRPC
- Drizzle ORM
- MySQL

### Procesamiento
- Sharp (optimización de imágenes)
- XLSX (lectura de Excel)
- Multer (upload de archivos)

## 📦 Instalación

### Requisitos Previos
- Node.js 18+
- MySQL 8+
- pnpm (recomendado) o npm

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/Kamchion/manus-store.git
cd manus-store
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar base de datos**
```bash
# Crear base de datos
mysql -u root -e "CREATE DATABASE IF NOT EXISTS b2b_store;"

# Restaurar datos (opcional)
mysql -u root b2b_store < backup_b2b_store.sql
```

4. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL=mysql://root@localhost:3306/b2b_store
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=b2b_store

# JWT
JWT_SECRET=tu_secreto_jwt_aqui_cambiar_en_produccion
```

5. **Ejecutar migraciones**
```bash
pnpm drizzle-kit push
```

6. **Iniciar servidor de desarrollo**
```bash
pnpm dev
```

La aplicación estará disponible en http://localhost:3000

## 👤 Credenciales de Acceso

### Usuario Administrador
- **Usuario**: `admin`
- **Contraseña**: `Admin2024!`

## 📖 Documentación

### Documentos Incluidos

- **ESTADO_PROYECTO_COMPLETO.md** - Estado completo del proyecto y guía para continuar
- **DOCUMENTACION_IMPORTACION.md** - Guía del sistema de importación masiva
- **MEJORAS_DISEÑO_RESPONSIVE.md** - Detalles de las mejoras de diseño
- **RESUMEN_COMPLETO_TAREAS.md** - Resumen de todas las tareas completadas

### Sistema de Importación

El sistema permite importar productos masivamente desde archivos Excel:

1. Accede al **Panel Admin** → **Importar**
2. Descarga la plantilla de Excel
3. Llena la plantilla con tus productos
4. Sube el Excel y las imágenes
5. Las imágenes se optimizan automáticamente a 400x400px

**Formato del Excel:**
- SKU (requerido)
- Nombre (requerido)
- Descripción
- Categoría
- Precio (requerido)
- Stock (requerido)
- Imagen (nombre del archivo)

## 🎨 Diseño Responsive

El catálogo se adapta automáticamente a diferentes tamaños de pantalla:

- **Móvil (< 640px)**: 2 columnas
- **Tablet pequeña (640px - 768px)**: 3 columnas
- **Tablet grande (768px - 1024px)**: 4 columnas
- **Desktop (1024px - 1280px)**: 5 columnas
- **Desktop XL (> 1280px)**: 6 columnas

## 🗂️ Estructura del Proyecto

```
manus-store/
├── client/                 # Frontend
│   ├── src/
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── components/    # Componentes reutilizables
│   │   └── _core/         # Configuración y utilidades
│   └── ...
├── server/                 # Backend
│   ├── _core/             # Configuración del servidor
│   ├── routers.ts         # Rutas tRPC
│   ├── db.ts              # Funciones de base de datos
│   ├── image-optimizer.ts # Optimización de imágenes
│   └── import-service.ts  # Servicio de importación
├── drizzle/               # Esquema de base de datos
├── scripts/               # Scripts de utilidad
└── public/                # Archivos estáticos
```

## 📊 Base de Datos

### Tablas Principales

- **users** - Usuarios del sistema
- **products** - Productos
- **productVariants** - Variantes de productos
- **rolePricing** - Precios por rol
- **orders** - Pedidos
- **orderItems** - Items de pedidos
- **cart** - Carrito de compras
- **cartItems** - Items del carrito

## 🚀 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo

# Producción
pnpm build            # Compilar para producción
pnpm preview          # Vista previa de producción

# Base de datos
pnpm drizzle-kit push    # Aplicar cambios al esquema
pnpm drizzle-kit studio  # Abrir Drizzle Studio

# Utilidades
pnpm tsx scripts/create-30-products.ts  # Crear productos de ejemplo
python3 create_import_example.py        # Crear archivos de ejemplo
```

## 🔐 Seguridad

- Autenticación basada en JWT
- Cookies seguras con httpOnly
- Validación de datos en backend
- Protección contra SQL injection (Drizzle ORM)
- Sanitización de uploads

## 📝 Próximas Funcionalidades

- [ ] Importación de variantes desde Excel
- [ ] Actualización de productos existentes
- [ ] Historial de importaciones
- [ ] Dashboard con estadísticas
- [ ] Reportes exportables (PDF, Excel)
- [ ] Integración con pasarelas de pago
- [ ] Sistema de envíos y tracking
- [ ] API pública para integraciones

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso exclusivo.

## 👨‍💻 Autor

**Kamchion**

## 🙏 Agradecimientos

- Desarrollado con Manus AI
- Optimizado para producción
- Diseño responsive moderno

---

**Versión**: 2.0.0  
**Última actualización**: Octubre 2025  
**Estado**: ✅ Producción-ready

