#!/bin/bash

# Script para compilar y preparar la app Android
# Uso: ./build-android.sh [debug|release]

set -e

BUILD_TYPE=${1:-debug}

echo "================================================"
echo "  Manus Store - Build Android ($BUILD_TYPE)"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json no encontrado${NC}"
  echo "Ejecuta este script desde la raíz del proyecto"
  exit 1
fi

# Paso 1: Limpiar build anterior
echo -e "${BLUE}[1/5] Limpiando builds anteriores...${NC}"
rm -rf dist/
rm -rf android/app/build/

# Paso 2: Instalar dependencias
echo -e "${BLUE}[2/5] Verificando dependencias...${NC}"
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  pnpm install
else
  echo "Dependencias ya instaladas"
fi

# Paso 3: Compilar frontend
echo -e "${BLUE}[3/5] Compilando frontend...${NC}"
pnpm build

# Verificar que el build fue exitoso
if [ ! -d "dist/public" ]; then
  echo -e "${RED}Error: El build del frontend falló${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Frontend compilado exitosamente${NC}"

# Paso 4: Sincronizar con Capacitor
echo -e "${BLUE}[4/5] Sincronizando con Capacitor...${NC}"
npx cap sync android

echo -e "${GREEN}✓ Sincronización completada${NC}"

# Paso 5: Compilar APK
echo -e "${BLUE}[5/5] Compilando APK ($BUILD_TYPE)...${NC}"

cd android

if [ "$BUILD_TYPE" = "release" ]; then
  echo "Compilando versión release..."
  ./gradlew assembleRelease
  
  APK_PATH="app/build/outputs/apk/release/app-release.apk"
  
  if [ -f "$APK_PATH" ]; then
    echo -e "${GREEN}✓ APK release generado exitosamente${NC}"
    echo ""
    echo "APK ubicado en: android/$APK_PATH"
    
    # Copiar APK a la raíz para fácil acceso
    cp "$APK_PATH" "../manus-store-release.apk"
    echo "Copia creada en: manus-store-release.apk"
  else
    echo -e "${RED}Error: APK release no encontrado${NC}"
    exit 1
  fi
else
  echo "Compilando versión debug..."
  ./gradlew assembleDebug
  
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
  
  if [ -f "$APK_PATH" ]; then
    echo -e "${GREEN}✓ APK debug generado exitosamente${NC}"
    echo ""
    echo "APK ubicado en: android/$APK_PATH"
    
    # Copiar APK a la raíz para fácil acceso
    cp "$APK_PATH" "../manus-store-debug.apk"
    echo "Copia creada en: manus-store-debug.apk"
  else
    echo -e "${RED}Error: APK debug no encontrado${NC}"
    exit 1
  fi
fi

cd ..

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✓ Build completado exitosamente${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Instalar APK en dispositivo Android"
echo "2. Probar funcionalidad offline"
echo "3. Verificar sincronización"
echo ""
