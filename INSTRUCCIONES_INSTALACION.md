# Instrucciones de Instalación - IMPORKAM Tienda B2B

## 📦 Contenido del Paquete

Este archivo ZIP contiene la tienda B2B IMPORKAM con el sistema de configuración expandido implementado.

**Última actualización**: 22 de Octubre, 2025  
**Commit**: 4f9b565  
**Características nuevas**: Sistema de configuración con tasa de impuesto, moneda y zona horaria configurables

## 🚀 Instalación

### Requisitos Previos

- Node.js 22.x o superior
- MySQL 8.0 o superior
- pnpm (gestor de paquetes)

### Pasos de Instalación

1. **Extraer el archivo ZIP**
   ```bash
   unzip imporkam-tienda-b2b-configuracion-20251022.zip
   cd imporkam-tienda-b2b-configuracion-20251022
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar base de datos**
   
   Crear archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus credenciales:
   ```
   DATABASE_URL=mysql://root@localhost:3306/b2b_store
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=b2b_store
   JWT_SECRET=tu_secret_key_seguro
   ```

4. **Crear base de datos**
   ```bash
   mysql -u root -p -e "CREATE DATABASE b2b_store;"
   ```

5. **Ejecutar migraciones**
   ```bash
   pnpm drizzle-kit push
   ```

6. **Insertar datos de prueba (opcional)**
   ```bash
   pnpm tsx scripts/seed.ts
   ```

7. **Insertar configuraciones del sistema**
   ```bash
   mysql -u root -p b2b_store < add_new_system_settings.sql
   ```

8. **Iniciar el servidor**
   ```bash
   pnpm dev
   ```

9. **Acceder a la aplicación**
   
   Abrir navegador en: `http://localhost:3000`

## 👤 Usuario de Prueba

Si ejecutaste el script de seed, puedes usar:

- **Usuario**: admin
- **Contraseña**: admin123
- **Rol**: Administrador

## ⚙️ Configuración del Sistema

Una vez iniciada sesión como administrador:

1. Ir a **Panel de Administración** → **Configuración**
2. Configurar:
   - Tasa de impuesto (default: 10%)
   - Moneda (USD, PYG, EUR, BRL, ARS)
   - Símbolo de moneda (default: $)
   - Zona horaria (default: America/Asuncion)
   - Nombre de tienda
   - Teléfono de contacto
   - Dirección

## 📚 Documentación Incluida

- `README.md` - Información general del proyecto
- `SISTEMA_CONFIGURACION_EXPANDIDO.md` - Guía técnica del sistema de configuración
- `RESUMEN_SESION_CONFIGURACION.md` - Resumen de cambios implementados

## 🛠️ Scripts Disponibles

```bash
pnpm dev          # Iniciar servidor de desarrollo
pnpm build        # Compilar para producción
pnpm start        # Iniciar servidor de producción
pnpm db:push      # Aplicar cambios de schema a DB
pnpm db:studio    # Abrir Drizzle Studio (GUI para DB)
```

## 🔧 Estructura del Proyecto

```
.
├── client/               # Frontend React + TypeScript
│   ├── src/
│   │   ├── pages/       # Páginas de la aplicación
│   │   ├── components/  # Componentes reutilizables
│   │   └── _core/       # Hooks y utilidades
├── server/              # Backend Express + tRPC
│   ├── routers.ts       # Definición de rutas API
│   ├── db.ts            # Operaciones de base de datos
│   └── _core/           # Sistema de autenticación
├── drizzle/             # Migraciones de base de datos
├── scripts/             # Scripts de utilidad
└── shared/              # Código compartido entre frontend y backend
```

## 🆘 Solución de Problemas

### Error de conexión a base de datos

Verificar que MySQL esté corriendo:
```bash
sudo systemctl status mysql
```

### Puerto 3000 en uso

Cambiar el puerto en `server/_core/index.ts` o matar el proceso:
```bash
lsof -ti:3000 | xargs kill -9
```

### Errores de dependencias

Limpiar caché y reinstalar:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📞 Soporte

Para preguntas o problemas, revisar la documentación técnica incluida o contactar al equipo de desarrollo.

## 📄 Licencia

Proyecto privado - IMPORKAM © 2025
