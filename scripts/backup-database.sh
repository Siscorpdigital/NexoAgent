#!/bin/bash
# Script para hacer backup de la base de datos actual

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Backup de Base de Datos - NexoAgent ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar si existe DATABASE_URL en .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: No se encontró archivo .env${NC}"
    exit 1
fi

# Leer DATABASE_URL del .env (o solicitarlo)
source .env 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL no encontrado en .env${NC}"
    echo -n "Ingresa tu DATABASE_URL de Render: "
    read DATABASE_URL
fi

# Crear directorio de backups si no existe
mkdir -p backups

# Generar nombre de archivo con fecha
BACKUP_FILE="backups/backup_nexoagent_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${BLUE}📦 Creando backup...${NC}"
echo -e "   Archivo: ${BACKUP_FILE}"
echo ""

# Hacer backup
if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        FILESIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo -e "${GREEN}✅ Backup creado exitosamente!${NC}"
        echo -e "   📁 Ubicación: ${BACKUP_FILE}"
        echo -e "   📊 Tamaño: ${FILESIZE}"
        echo ""
        echo -e "${YELLOW}💡 Guarda este archivo en un lugar seguro${NC}"
        echo -e "   (Google Drive, Dropbox, etc.)${NC}"
    else
        echo -e "${RED}❌ Error al crear backup${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  pg_dump no encontrado${NC}"
    echo ""
    echo -e "${BLUE}Alternativa: Exportar desde Prisma Studio${NC}"
    echo "1. Ejecuta: npm run db:studio"
    echo "2. Exporta manualmente las tablas"
    echo ""
    echo -e "${BLUE}O instala PostgreSQL client:${NC}"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi
