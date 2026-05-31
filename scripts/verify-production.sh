#!/bin/bash

# Script de verificación para producción
# Uso: ./scripts/verify-production.sh https://tu-dominio.com

if [ -z "$1" ]; then
  echo "❌ Error: Debes proporcionar la URL de producción"
  echo "Uso: ./scripts/verify-production.sh https://tu-dominio.com"
  exit 1
fi

URL=$1
echo "🔍 Verificando NexoAgent en: $URL"
echo ""

# 1. Health check
echo "1️⃣ Health check..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/health")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ API health: OK ($STATUS)"
else
  echo "   ❌ API health: FAIL ($STATUS)"
fi

# 2. Dashboard
echo "2️⃣ Dashboard..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/dashboard")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Dashboard: OK ($STATUS)"
else
  echo "   ❌ Dashboard: FAIL ($STATUS)"
fi

# 3. Webhook verification endpoint
echo "3️⃣ Webhook endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "403" ]; then
  echo "   ✅ Webhook: Disponible ($STATUS)"
else
  echo "   ❌ Webhook: No disponible ($STATUS)"
fi

echo ""
echo "📋 Checklist manual:"
echo "   - [ ] Crear empresa de prueba en /dashboard/empresas"
echo "   - [ ] Verificar que todos los módulos cargan:"
echo "     - [ ] Conversaciones"
echo "     - [ ] CRM"
echo "     - [ ] Conocimiento"
echo "     - [ ] Memoria"
echo "     - [ ] Automatizaciones"
echo "     - [ ] Agenda (NEW)"
echo "     - [ ] Analíticas"
echo "     - [ ] Configuración"
echo "   - [ ] Subir documento de prueba"
echo "   - [ ] Crear cita en Agenda"
echo "   - [ ] Enviar mensaje de prueba vía WhatsApp"
echo ""
echo "✅ Verificación completada"
