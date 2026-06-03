#!/bin/bash
# Script para configurar Vercel automáticamente

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Setup Automático de Vercel        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Vercel CLI...${NC}"
    npm install -g vercel
    echo ""
fi

# Login en Vercel
echo -e "${BLUE}🔐 Iniciando sesión en Vercel...${NC}"
echo -e "${YELLOW}   Se abrirá tu navegador para autenticar${NC}"
echo ""
vercel login

echo ""
echo -e "${BLUE}🚀 Configurando proyecto...${NC}"

# Link del proyecto (esto lo conecta a tu repo de GitHub)
vercel link

echo ""
echo -e "${GREEN}✅ Proyecto configurado!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Siguiente paso:${NC}"
echo -e "   1. Ir a: https://vercel.com/dashboard"
echo -e "   2. Seleccionar tu proyecto 'nexoagent'"
echo -e "   3. Settings → Environment Variables"
echo -e "   4. Agregar las variables (usa el script: setup-env-vars.sh)"
echo ""
