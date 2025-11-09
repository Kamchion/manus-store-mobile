# Instrucciones para Subir el Proyecto a GitHub

## 📋 Contenido del Paquete

El archivo `tienda-b2b-completo.zip` contiene:

1. **Código fuente completo** del proyecto
2. **Base de datos** (`database_backup.sql`) con todos los datos
3. **Documentación** (README_GITHUB.md)
4. **Configuración** (.gitignore, tsconfig.json, etc.)
5. **Assets** (logos, plantillas Excel, etc.)

## 🚀 Pasos para Subir a GitHub

### Opción 1: Crear Nuevo Repositorio (Recomendado)

1. **Descomprimir el archivo**
   ```bash
   unzip tienda-b2b-completo.zip
   cd tienda-b2b
   ```

2. **Inicializar Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Tienda B2B Imporkam v1.0"
   ```

3. **Crear repositorio en GitHub**
   - Ve a https://github.com/new
   - Nombre: `tienda-b2b-imporkam` (o el que prefieras)
   - Descripción: "Sistema de comercio electrónico B2B con gestión multi-rol"
   - Privado/Público: Selecciona según tus necesidades
   - **NO** marques "Add README" ni ".gitignore" (ya están incluidos)

4. **Conectar y subir**
   ```bash
   git remote add origin https://github.com/TU-USUARIO/tienda-b2b-imporkam.git
   git branch -M main
   git push -u origin main
   ```

### Opción 2: Usar GitHub CLI (gh)

1. **Descomprimir el archivo**
   ```bash
   unzip tienda-b2b-completo.zip
   cd tienda-b2b
   ```

2. **Crear y subir con un comando**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Tienda B2B Imporkam v1.0"
   gh repo create tienda-b2b-imporkam --private --source=. --push
   ```

### Opción 3: Usar GitHub Desktop

1. Descomprimir `tienda-b2b-completo.zip`
2. Abrir GitHub Desktop
3. File → Add Local Repository
4. Seleccionar la carpeta `tienda-b2b`
5. Publish repository
6. Elegir nombre y privacidad
7. Publicar

## 📦 Importar Base de Datos

### En tu servidor de producción:

```bash
# Método 1: Desde archivo local
mysql -h TU_HOST -P PUERTO -u USUARIO -p NOMBRE_DB < database_backup.sql

# Método 2: Desde MySQL Workbench
# 1. Conectar a tu base de datos
# 2. Server → Data Import
# 3. Seleccionar database_backup.sql
# 4. Start Import

# Método 3: Desde phpMyAdmin
# 1. Seleccionar base de datos
# 2. Ir a "Importar"
# 3. Seleccionar database_backup.sql
# 4. Ejecutar
```

### En TiDB Cloud:

```bash
# Usar el comando mysql con las credenciales de TiDB
mysql -h gateway02.us-east-1.prod.aws.tidbcloud.com \
      -P 4000 \
      -u TU_USUARIO \
      -p \
      TU_DATABASE < database_backup.sql
```

## ⚙️ Configuración Post-Instalación

1. **Clonar el repositorio** (en tu servidor o local)
   ```bash
   git clone https://github.com/TU-USUARIO/tienda-b2b-imporkam.git
   cd tienda-b2b-imporkam
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

4. **Importar base de datos** (ver sección anterior)

5. **Ejecutar el proyecto**
   ```bash
   # Desarrollo
   pnpm dev

   # Producción
   pnpm build
   pnpm start
   ```

## 🔐 Variables de Entorno Importantes

Asegúrate de configurar estas variables en `.env`:

```env
# CRÍTICO: Base de datos
DATABASE_URL=mysql://usuario:password@host:puerto/database

# CRÍTICO: Seguridad
JWT_SECRET=genera-un-secreto-muy-seguro-aqui

# OAuth (si usas Manus OAuth)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=tu-app-id

# Personalización
VITE_APP_TITLE=Tienda B2B Imporkam
VITE_APP_LOGO=/assets/imporkam-logo.png

# Owner (primer admin)
OWNER_OPEN_ID=tu-open-id
OWNER_NAME=Tu Nombre
```

## 📝 Archivos Importantes

### Incluidos en el ZIP:
- `README_GITHUB.md` - Documentación completa del proyecto
- `database_backup.sql` - Backup completo de la base de datos
- `.gitignore` - Archivos a ignorar en Git
- `package.json` - Dependencias y scripts
- `tsconfig.json` - Configuración de TypeScript
- `vite.config.ts` - Configuración de Vite

### NO incluidos (generados localmente):
- `node_modules/` - Se genera con `pnpm install`
- `dist/` - Se genera con `pnpm build`
- `.env` - Debe crearse manualmente (usar `.env.example` como base)

## 🔄 Workflow de Desarrollo

### Para trabajar en el proyecto:

1. **Clonar y configurar**
   ```bash
   git clone https://github.com/TU-USUARIO/tienda-b2b-imporkam.git
   cd tienda-b2b-imporkam
   pnpm install
   cp .env.example .env
   # Configurar .env
   ```

2. **Crear rama para nueva funcionalidad**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

3. **Desarrollar y probar**
   ```bash
   pnpm dev
   # Hacer cambios...
   ```

4. **Commit y push**
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push origin feature/nueva-funcionalidad
   ```

5. **Crear Pull Request en GitHub**

6. **Merge a main** después de revisión

## 🚨 Notas Importantes

### Seguridad:
- ✅ El `.gitignore` ya está configurado para NO subir `.env`
- ✅ NO subas credenciales al repositorio
- ✅ Usa variables de entorno para información sensible
- ✅ El archivo `database_backup.sql` contiene datos reales - considera si debe estar en el repo

### Base de Datos:
- El backup SQL incluye TODOS los datos actuales
- Incluye usuarios, productos, pedidos, configuración
- Revisa si hay datos sensibles antes de compartir el repositorio

### Archivos Grandes:
- El `.gitignore` excluye `node_modules/` (puede ser > 500MB)
- Las imágenes en `public/uploads/` están incluidas
- Si tienes muchas imágenes, considera usar Git LFS

## 📞 Soporte

Si tienes problemas durante el proceso:

1. Verifica que Git esté instalado: `git --version`
2. Verifica autenticación en GitHub
3. Revisa los permisos del repositorio
4. Consulta la documentación de GitHub: https://docs.github.com

## ✅ Checklist Final

Antes de considerar el proyecto subido correctamente:

- [ ] Repositorio creado en GitHub
- [ ] Código subido completamente
- [ ] README visible en GitHub
- [ ] `.gitignore` funcionando (no hay `node_modules/` en GitHub)
- [ ] Base de datos importada en servidor de producción
- [ ] Variables de entorno configuradas
- [ ] Proyecto funciona localmente después de clonar
- [ ] Documentación actualizada

---

**¡Listo!** Tu proyecto está ahora en GitHub y listo para colaboración o despliegue.

