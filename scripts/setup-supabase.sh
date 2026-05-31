#!/bin/bash

# Script para configurar Supabase con NexoAgent
# Uso: ./scripts/setup-supabase.sh

set -e

echo "🚀 Setup de Supabase para NexoAgent"
echo "===================================="
echo ""

# Verificar que existe .env.local o .env.production
if [ ! -f .env.local ] && [ ! -f .env.production ]; then
  echo "⚠️  No se encontró archivo .env.local ni .env.production"
  echo ""
  echo "Por favor, crea uno de estos archivos con tus credenciales de Supabase:"
  echo ""
  echo "DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
  echo "DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
  echo ""
  echo "Puedes copiar .env.production.example como referencia"
  exit 1
fi

# Paso 1: Validar el schema
echo "📋 Paso 1/4: Validando schema de Prisma..."
npx prisma validate
echo "✅ Schema válido"
echo ""

# Paso 2: Generar cliente
echo "⚙️  Paso 2/4: Generando cliente de Prisma..."
npx prisma generate
echo "✅ Cliente generado"
echo ""

# Paso 3: Ejecutar migraciones
echo "🗄️  Paso 3/4: Ejecutando migraciones en Supabase..."
echo ""
echo "Esto creará todas las tablas en tu base de datos de Supabase."
read -p "¿Continuar? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx prisma migrate deploy
  echo "✅ Migraciones ejecutadas"
else
  echo "❌ Migraciones canceladas"
  exit 1
fi
echo ""

# Paso 4: Sembrar datos iniciales (opcional)
echo "🌱 Paso 4/4: Sembrar datos iniciales (opcional)"
echo ""
echo "Esto creará:"
echo "  - Usuario admin (admin@nexoagent.com / Admin123!)"
echo "  - Empresa demo"
echo "  - Memoria estructurada inicial"
echo "  - Automatizaciones básicas"
echo ""
read -p "¿Sembrar datos iniciales? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx tsx prisma/seed-production.ts
  echo ""
  echo "✅ Datos sembrados"
else
  echo "⏭️  Datos iniciales omitidos"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "Puedes verificar tu base de datos con:"
echo "  npx prisma studio"
echo ""
echo "Para probar la aplicación:"
echo "  npm run dev"
echo ""
