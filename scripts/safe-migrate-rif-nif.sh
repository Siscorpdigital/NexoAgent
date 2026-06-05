#!/bin/bash

# Safe migration script para RIF/NIF unique constraints
# Incluye verificación de duplicados antes de aplicar

set -e

echo "🔍 MIGRACIÓN SEGURA: Unique Constraints RIF/NIF"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verificar que la DB esté accesible
echo "📡 Verificando conexión a base de datos..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión exitosa${NC}"
else
    echo -e "${RED}❌ Error: No se puede conectar a la base de datos${NC}"
    echo "Verifica DATABASE_URL en .env"
    exit 1
fi
echo ""

# Step 2: Verificar duplicados
echo "🔍 Verificando duplicados existentes..."
echo ""

# Verificar RIF duplicados
echo "Verificando RIF duplicados..."
DUPLICATE_RIF=$(npx prisma db execute --stdin <<EOF
SELECT rif, COUNT(*) as count
FROM "Empresa"
WHERE rif IS NOT NULL
GROUP BY rif
HAVING COUNT(*) > 1;
EOF
)

if [ -n "$DUPLICATE_RIF" ] && [ "$DUPLICATE_RIF" != "[]" ]; then
    echo -e "${RED}❌ ADVERTENCIA: Se encontraron RIF duplicados:${NC}"
    echo "$DUPLICATE_RIF"
    echo ""
    echo -e "${YELLOW}⚠️  Debes limpiar los duplicados antes de continuar.${NC}"
    echo "Ejecuta: npx prisma studio"
    echo "O ejecuta el script de limpieza manual."
    exit 1
else
    echo -e "${GREEN}✅ No hay RIF duplicados${NC}"
fi

# Verificar NIF duplicados
echo "Verificando NIF duplicados..."
DUPLICATE_NIF=$(npx prisma db execute --stdin <<EOF
SELECT nif, COUNT(*) as count
FROM "Empresa"
WHERE nif IS NOT NULL
GROUP BY nif
HAVING COUNT(*) > 1;
EOF
)

if [ -n "$DUPLICATE_NIF" ] && [ "$DUPLICATE_NIF" != "[]" ]; then
    echo -e "${RED}❌ ADVERTENCIA: Se encontraron NIF duplicados:${NC}"
    echo "$DUPLICATE_NIF"
    echo ""
    echo -e "${YELLOW}⚠️  Debes limpiar los duplicados antes de continuar.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No hay NIF duplicados${NC}"
fi

echo ""

# Step 3: Backup recomendación
echo -e "${YELLOW}⚠️  RECOMENDACIÓN: Hacer backup antes de migrar${NC}"
echo "Comando: pg_dump \$DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql"
echo ""
read -p "¿Continuar con la migración? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Migración cancelada."
    exit 0
fi

echo ""

# Step 4: Aplicar migración SQL
echo "🔄 Aplicando constraints únicos..."

# Primero intentar eliminar constraints existentes si los hay
npx prisma db execute --stdin <<EOF > /dev/null 2>&1 || true
ALTER TABLE "Empresa" DROP CONSTRAINT IF EXISTS "Empresa_rif_key";
ALTER TABLE "Empresa" DROP CONSTRAINT IF EXISTS "Empresa_nif_key";
EOF

# Aplicar los nuevos constraints
npx prisma db execute --file prisma/migrations/add_unique_rif_nif.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Constraints SQL aplicados exitosamente${NC}"
else
    echo -e "${RED}❌ Error al aplicar constraints SQL${NC}"
    exit 1
fi

echo ""

# Step 5: Sincronizar Prisma schema
echo "🔄 Sincronizando Prisma schema..."
npx prisma generate > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client regenerado${NC}"
else
    echo -e "${RED}❌ Error al regenerar Prisma client${NC}"
    exit 1
fi

echo ""

# Step 6: Verificar constraints aplicados
echo "🔍 Verificando constraints en base de datos..."
CONSTRAINTS=$(npx prisma db execute --stdin <<EOF
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'Empresa'::regclass
    AND conname IN ('Empresa_rif_key', 'Empresa_nif_key');
EOF
)

if [ -n "$CONSTRAINTS" ]; then
    echo -e "${GREEN}✅ Constraints verificados en base de datos${NC}"
    echo "$CONSTRAINTS"
else
    echo -e "${YELLOW}⚠️  No se pudieron verificar los constraints${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ MIGRACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo "================================================"
echo ""
echo "📝 Cambios aplicados:"
echo "   • RIF: UNIQUE constraint (permite NULL)"
echo "   • NIF: UNIQUE constraint (permite NULL)"
echo ""
echo "🔄 Próximos pasos:"
echo "   1. Verificar en Prisma Studio que todo funciona"
echo "   2. Probar crear empresa con RIF/NIF duplicado (debe fallar)"
echo "   3. Commit y push del schema actualizado"
echo ""
