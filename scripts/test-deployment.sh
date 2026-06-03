#!/bin/bash
# Script para verificar que el deployment está funcionando correctamente

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test de Deployment - NexoAgent      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Solicitar URL
read -p "Ingresa la URL de tu deployment (ej: https://nexoagent.vercel.app): " DEPLOYMENT_URL

echo ""
echo -e "${BLUE}🧪 Ejecutando tests...${NC}"
echo ""

# Test 1: Homepage
echo -n "1. Verificando homepage... "
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$DEPLOYMENT_URL")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "308" ]; then
    echo -e "${GREEN}✅ OK (${HTTP_CODE})${NC}"
else
    echo -e "${RED}❌ Error (${HTTP_CODE})${NC}"
fi

# Test 2: API Health
echo -n "2. Verificando API... "
API_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$DEPLOYMENT_URL/api/health" 2>/dev/null)
if [ "$API_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
elif [ "$API_CODE" = "404" ]; then
    echo -e "${YELLOW}⚠️  Endpoint no existe (normal)${NC}"
else
    echo -e "${YELLOW}⚠️  No verificable${NC}"
fi

# Test 3: Login page
echo -n "3. Verificando página de login... "
LOGIN_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$DEPLOYMENT_URL/login")
if [ "$LOGIN_CODE" = "200" ] || [ "$LOGIN_CODE" = "308" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Error (${LOGIN_CODE})${NC}"
fi

# Test 4: Static assets
echo -n "4. Verificando assets estáticos... "
FAVICON_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$DEPLOYMENT_URL/favicon.ico")
if [ "$FAVICON_CODE" = "200" ] || [ "$FAVICON_CODE" = "404" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  (${FAVICON_CODE})${NC}"
fi

# Test 5: SSL Certificate
echo -n "5. Verificando SSL... "
if [[ $DEPLOYMENT_URL == https://* ]]; then
    SSL_CHECK=$(curl -I -s "$DEPLOYMENT_URL" | grep -i "HTTP" | head -n 1)
    if [[ $SSL_CHECK == *"200"* ]] || [[ $SSL_CHECK == *"308"* ]]; then
        echo -e "${GREEN}✅ HTTPS activo${NC}"
    else
        echo -e "${RED}❌ Error SSL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  URL no es HTTPS${NC}"
fi

# Test 6: Response time
echo -n "6. Verificando tiempo de respuesta... "
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$DEPLOYMENT_URL")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d. -f1)
if [ "$RESPONSE_MS" -lt 1000 ]; then
    echo -e "${GREEN}✅ ${RESPONSE_MS}ms (excelente)${NC}"
elif [ "$RESPONSE_MS" -lt 3000 ]; then
    echo -e "${YELLOW}⚠️  ${RESPONSE_MS}ms (aceptable)${NC}"
else
    echo -e "${RED}❌ ${RESPONSE_MS}ms (lento)${NC}"
fi

echo ""
echo -e "${BLUE}📊 Resumen${NC}"
echo "────────────────────────────────────────"
echo -e "URL testeada: ${DEPLOYMENT_URL}"
echo -e "Fecha: $(date)"
echo ""

# Test manual checklist
echo -e "${YELLOW}📋 Checklist Manual (probar en navegador):${NC}"
echo ""
echo "  [ ] Login funciona"
echo "  [ ] Dashboard carga"
echo "  [ ] Ver empresas"
echo "  [ ] Ver conversaciones"
echo "  [ ] Crear contacto de prueba"
echo "  [ ] Enviar mensaje WhatsApp"
echo "  [ ] Notificaciones push"
echo ""
echo -e "${BLUE}🌐 Abrir en navegador:${NC}"
echo -e "   ${DEPLOYMENT_URL}"
echo ""
