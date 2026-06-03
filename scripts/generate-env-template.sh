#!/bin/bash
# Script para generar template de variables de entorno para Vercel

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

OUTPUT_FILE="vercel-env-template.txt"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Generador de Variables para Vercel  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📝 Este script te guiará para crear las variables de entorno${NC}"
echo ""

# Función para solicitar input
ask() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    local secret="$4"

    if [ "$secret" = "true" ]; then
        echo -n "$prompt: "
        read -s value
        echo ""
    else
        if [ -n "$default" ]; then
            echo -n "$prompt [$default]: "
        else
            echo -n "$prompt: "
        fi
        read value
        value=${value:-$default}
    fi

    echo "$var_name=\"$value\"" >> "$OUTPUT_FILE"
}

# Limpiar archivo anterior
> "$OUTPUT_FILE"

echo "# ════════════════════════════════════════" >> "$OUTPUT_FILE"
echo "# Variables de Entorno para Vercel" >> "$OUTPUT_FILE"
echo "# Generado: $(date)" >> "$OUTPUT_FILE"
echo "# ════════════════════════════════════════" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo -e "${BLUE}🗄️  BASE DE DATOS${NC}"
echo "─────────────────────────────────────────"
ask "DATABASE_URL (Supabase o Render)" "DATABASE_URL" "" false
ask "DIRECT_URL (misma que DATABASE_URL)" "DIRECT_URL" "" false
echo "" >> "$OUTPUT_FILE"

echo ""
echo -e "${BLUE}🔐 AUTENTICACIÓN${NC}"
echo "─────────────────────────────────────────"

# Generar NEXTAUTH_SECRET automáticamente
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"" >> "$OUTPUT_FILE"
echo -e "${GREEN}✅ NEXTAUTH_SECRET generado automáticamente${NC}"

ask "NEXTAUTH_URL (ej: https://nexoagent.vercel.app)" "NEXTAUTH_URL" "https://nexoagent.vercel.app" false
echo "" >> "$OUTPUT_FILE"

echo ""
echo -e "${BLUE}📱 TWILIO WHATSAPP${NC}"
echo "─────────────────────────────────────────"
ask "TWILIO_ACCOUNT_SID" "TWILIO_ACCOUNT_SID" "" false
ask "TWILIO_AUTH_TOKEN" "TWILIO_AUTH_TOKEN" "" true
ask "TWILIO_WHATSAPP_FROM" "TWILIO_WHATSAPP_FROM" "whatsapp:+14155238886" false
echo "" >> "$OUTPUT_FILE"

echo ""
echo -e "${BLUE}🔔 PUSH NOTIFICATIONS${NC}"
echo "─────────────────────────────────────────"
ask "NEXT_PUBLIC_VAPID_PUBLIC_KEY" "NEXT_PUBLIC_VAPID_PUBLIC_KEY" "" false
ask "VAPID_PRIVATE_KEY" "VAPID_PRIVATE_KEY" "" true
ask "PUSH_NOTIFICATION_EMAIL" "PUSH_NOTIFICATION_EMAIL" "mailto:perofaga@gmail.com" false
echo "" >> "$OUTPUT_FILE"

echo ""
echo -e "${BLUE}🤖 OPENAI (opcional)${NC}"
echo "─────────────────────────────────────────"
read -p "¿Usas OpenAI? (y/n): " use_openai
if [ "$use_openai" = "y" ]; then
    ask "OPENAI_API_KEY" "OPENAI_API_KEY" "" true
    echo "" >> "$OUTPUT_FILE"
fi

echo ""
echo -e "${GREEN}✅ Template generado: ${OUTPUT_FILE}${NC}"
echo ""
echo -e "${YELLOW}📋 Siguiente paso:${NC}"
echo -e "   1. Abrir: cat ${OUTPUT_FILE}"
echo -e "   2. Copiar cada variable"
echo -e "   3. Pegar en Vercel → Settings → Environment Variables"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: No subir este archivo a GitHub${NC}"
