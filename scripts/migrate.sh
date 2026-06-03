#!/bin/bash
# Script maestro para guiar toda la migración

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${BOLD}${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🚀 Migración Render → Vercel + Dominio           ║
║                                                          ║
║                    NexoAgent v1.0                        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${YELLOW}Este asistente te guiará paso a paso en la migración${NC}"
echo -e "${YELLOW}Tiempo estimado: 45-60 minutos${NC}"
echo ""
read -p "Presiona ENTER para continuar..."

clear

# ═══════════════════════════════════════════════════════════
# FASE 1: PREPARACIÓN
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  FASE 1: Preparación y Backup (15 min)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}1.1 Verificando estado del código...${NC}"
git status

if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✅ Todo está commiteado${NC}"
else
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear${NC}"
    read -p "¿Deseas commitear ahora? (y/n): " commit_now
    if [ "$commit_now" = "y" ]; then
        git add -A
        git commit -m "pre-migration: estado estable antes de Vercel"
        git push origin main
    fi
fi

echo ""
echo -e "${YELLOW}1.2 Backup de base de datos${NC}"
read -p "¿Tienes una base de datos en Render que necesitas respaldar? (y/n): " need_backup

if [ "$need_backup" = "y" ]; then
    echo -e "${BLUE}Ejecutando backup...${NC}"
    bash scripts/backup-database.sh
else
    echo -e "${YELLOW}⚠️  Saltando backup. Asegúrate de tener tus datos respaldados.${NC}"
fi

echo ""
read -p "Presiona ENTER para continuar a la Fase 2..."

clear

# ═══════════════════════════════════════════════════════════
# FASE 2: VERCEL SETUP
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  FASE 2: Setup de Vercel (10 min)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

read -p "¿Ya tienes cuenta en Vercel? (y/n): " has_vercel

if [ "$has_vercel" = "n" ]; then
    echo ""
    echo -e "${YELLOW}📝 Crear cuenta en Vercel:${NC}"
    echo -e "   1. Abre: ${BLUE}https://vercel.com/signup${NC}"
    echo -e "   2. Click en 'Continue with GitHub'"
    echo -e "   3. Autoriza el acceso"
    echo ""
    read -p "Presiona ENTER cuando tengas la cuenta creada..."
fi

echo ""
echo -e "${BLUE}🚀 Configurando Vercel CLI...${NC}"
bash scripts/setup-vercel.sh

echo ""
read -p "Presiona ENTER para continuar a la Fase 3..."

clear

# ═══════════════════════════════════════════════════════════
# FASE 3: BASE DE DATOS
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  FASE 3: Base de Datos (15 min)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}¿Qué deseas hacer con tu base de datos?${NC}"
echo ""
echo "  1) Migrar a Supabase (RECOMENDADO - Gratis)"
echo "  2) Mantener BD actual en Render"
echo "  3) Usar otra BD (Railway, Neon, etc.)"
echo ""
read -p "Selecciona opción (1-3): " db_option

case $db_option in
    1)
        echo ""
        echo -e "${BLUE}📝 Migrar a Supabase:${NC}"
        echo ""
        echo "  1. Abre: ${BLUE}https://supabase.com/dashboard${NC}"
        echo "  2. Click 'New Project'"
        echo "  3. Configurar:"
        echo "     - Name: nexoagent-production"
        echo "     - Password: (genera una segura y guárdala)"
        echo "     - Region: Europe West"
        echo "  4. Click 'Create new project'"
        echo "  5. Espera 2-3 minutos"
        echo ""
        read -p "Presiona ENTER cuando el proyecto esté creado..."

        echo ""
        echo "  6. Settings → Database"
        echo "  7. Buscar: 'Connection string' → URI"
        echo "  8. Copiar la cadena completa"
        echo ""
        read -p "Pega tu DATABASE_URL aquí: " SUPABASE_URL

        echo ""
        echo -e "${BLUE}Restaurando backup...${NC}"

        if [ -d "backups" ] && [ "$(ls -A backups)" ]; then
            LATEST_BACKUP=$(ls -t backups/*.sql | head -1)
            echo "Backup encontrado: $LATEST_BACKUP"
            read -p "¿Restaurar este backup? (y/n): " restore_backup

            if [ "$restore_backup" = "y" ]; then
                if command -v psql &> /dev/null; then
                    psql "$SUPABASE_URL" < "$LATEST_BACKUP"
                    echo -e "${GREEN}✅ Backup restaurado${NC}"
                else
                    echo -e "${YELLOW}⚠️  psql no instalado. Alternativa:${NC}"
                    echo "DATABASE_URL=\"$SUPABASE_URL\" npx prisma migrate deploy"
                fi
            fi
        else
            echo -e "${YELLOW}No se encontró backup. Ejecutando migraciones desde cero...${NC}"
            DATABASE_URL="$SUPABASE_URL" npx prisma migrate deploy
        fi
        ;;
    2)
        echo ""
        echo -e "${YELLOW}Mantendrás tu BD actual en Render${NC}"
        read -p "Pega tu DATABASE_URL de Render: " SUPABASE_URL
        ;;
    3)
        echo ""
        read -p "Pega tu DATABASE_URL: " SUPABASE_URL
        ;;
esac

echo ""
echo -e "${GREEN}✅ Base de datos configurada${NC}"
echo ""
read -p "Presiona ENTER para continuar a la Fase 4..."

clear

# ═══════════════════════════════════════════════════════════
# FASE 4: VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  FASE 4: Variables de Entorno (10 min)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

read -p "¿Quieres generar un template de variables? (y/n): " gen_template

if [ "$gen_template" = "y" ]; then
    bash scripts/generate-env-template.sh

    echo ""
    echo -e "${YELLOW}📋 Ahora copia las variables a Vercel:${NC}"
    echo ""
    echo "  1. Abre: ${BLUE}https://vercel.com/dashboard${NC}"
    echo "  2. Selecciona tu proyecto 'nexoagent'"
    echo "  3. Settings → Environment Variables"
    echo "  4. Copia cada variable de: vercel-env-template.txt"
    echo "  5. Marca los 3 environments (Production, Preview, Development)"
    echo ""

    if [ -f "vercel-env-template.txt" ]; then
        echo -e "${BLUE}Contenido del template:${NC}"
        echo "─────────────────────────────────────────"
        cat vercel-env-template.txt
        echo "─────────────────────────────────────────"
    fi
else
    echo -e "${YELLOW}Asegúrate de configurar manualmente en Vercel:${NC}"
    echo "  - DATABASE_URL"
    echo "  - NEXTAUTH_SECRET"
    echo "  - TWILIO_*"
    echo "  - VAPID_*"
fi

echo ""
read -p "Presiona ENTER cuando hayas configurado TODAS las variables..."

clear

# ═══════════════════════════════════════════════════════════
# FASE 5: DEPLOY
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  FASE 5: Primer Deploy (5 min)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 Desplegando a Vercel...${NC}"
echo ""

read -p "¿Desplegar ahora? (y/n): " do_deploy

if [ "$do_deploy" = "y" ]; then
    vercel --prod

    echo ""
    echo -e "${GREEN}✅ Deploy completado!${NC}"

    # Obtener URL del deployment
    VERCEL_URL=$(vercel ls | grep "nexoagent" | head -1 | awk '{print $2}')

    if [ -n "$VERCEL_URL" ]; then
        echo ""
        echo -e "${BLUE}📍 URL de tu aplicación:${NC}"
        echo -e "   ${GREEN}https://$VERCEL_URL${NC}"
        echo ""

        # Guardar URL para siguiente fase
        echo "$VERCEL_URL" > .vercel-url.tmp
    fi
fi

echo ""
read -p "Presiona ENTER para continuar a la Fase 6..."

clear

# ═══════════════════════════════════════════════════════════
# FASE 6: DOMINIO
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  FASE 6: Dominio Personalizado (30 min)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

read -p "¿Quieres configurar un dominio propio? (y/n): " setup_domain

if [ "$setup_domain" = "y" ]; then
    echo ""
    read -p "¿Ya compraste un dominio? (y/n): " has_domain

    if [ "$has_domain" = "n" ]; then
        echo ""
        echo -e "${YELLOW}📝 Comprar dominio:${NC}"
        echo ""
        echo "  Opciones recomendadas:"
        echo "  - Namecheap: https://www.namecheap.com (~\$10/año)"
        echo "  - GoDaddy: https://www.godaddy.com (~\$12/año)"
        echo "  - Cloudflare: https://www.cloudflare.com (~\$9/año)"
        echo ""
        read -p "Presiona ENTER cuando hayas comprado tu dominio..."
    fi

    echo ""
    read -p "Ingresa tu dominio (ej: nexoagent.com): " DOMAIN

    echo ""
    echo -e "${YELLOW}📝 Configurar dominio en Vercel:${NC}"
    echo ""
    echo "  1. Abre: ${BLUE}https://vercel.com/dashboard${NC}"
    echo "  2. Selecciona 'nexoagent'"
    echo "  3. Settings → Domains → Add"
    echo "  4. Ingresa: $DOMAIN"
    echo "  5. Vercel te mostrará opciones de DNS"
    echo ""
    echo -e "${YELLOW}Opción A (Recomendado): Nameservers${NC}"
    echo "  - ns1.vercel-dns.com"
    echo "  - ns2.vercel-dns.com"
    echo ""
    echo -e "${YELLOW}Opción B: A Record${NC}"
    echo "  - 76.76.21.21"
    echo ""
    read -p "Presiona ENTER cuando hayas configurado el DNS..."

    echo ""
    echo -e "${BLUE}⏳ Propagación DNS puede tomar 10-60 minutos${NC}"
    echo ""
    echo -e "${YELLOW}Verificar propagación:${NC}"
    echo "  https://www.whatsmydns.net"
    echo ""

    read -p "¿Verificar propagación ahora? (y/n): " check_dns

    if [ "$check_dns" = "y" ]; then
        echo ""
        echo "Consultando DNS para $DOMAIN..."
        dig $DOMAIN +short
    fi

    echo ""
    echo -e "${RED}⚠️  IMPORTANTE: Actualizar NEXTAUTH_URL${NC}"
    echo ""
    echo "  1. Vercel → Settings → Environment Variables"
    echo "  2. Editar NEXTAUTH_URL"
    echo "  3. Cambiar a: https://$DOMAIN"
    echo "  4. Redeploy el proyecto"
    echo ""
    read -p "Presiona ENTER cuando hayas actualizado NEXTAUTH_URL..."

else
    echo -e "${YELLOW}Saltando configuración de dominio${NC}"
    echo -e "Puedes configurarlo después en: Settings → Domains"
fi

echo ""
read -p "Presiona ENTER para continuar a la Fase 7..."

clear

# ═══════════════════════════════════════════════════════════
# FASE 7: TESTING
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  FASE 7: Testing y Verificación (15 min)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

read -p "¿Ejecutar tests automáticos? (y/n): " run_tests

if [ "$run_tests" = "y" ]; then
    bash scripts/test-deployment.sh
fi

echo ""
echo -e "${YELLOW}📋 Checklist manual:${NC}"
echo ""
echo "  Abre tu aplicación y verifica:"
echo ""
echo "  [ ] Login funciona"
echo "  [ ] Dashboard carga correctamente"
echo "  [ ] Ver lista de empresas"
echo "  [ ] Ver conversaciones"
echo "  [ ] Crear un contacto de prueba"
echo "  [ ] Enviar mensaje WhatsApp de prueba"
echo "  [ ] Probar notificaciones push"
echo ""

read -p "¿Todo funciona correctamente? (y/n): " all_works

if [ "$all_works" != "y" ]; then
    echo ""
    echo -e "${RED}⚠️  Problemas encontrados${NC}"
    echo ""
    echo "Revisar logs:"
    echo "  vercel logs --follow"
    echo ""
    echo "O en dashboard:"
    echo "  https://vercel.com/dashboard → Tu proyecto → Logs"
    echo ""
    read -p "Presiona ENTER cuando hayas resuelto los problemas..."
fi

clear

# ═══════════════════════════════════════════════════════════
# FASE 8: FINALIZACIÓN
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}  FASE 8: Apagar Render (Esperar 48-72h)${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⚠️  NO apagar Render inmediatamente${NC}"
echo ""
echo "Espera 2-3 días para verificar que:"
echo "  - Vercel está 100% estable"
echo "  - No hay errores inesperados"
echo "  - Los usuarios no reportan problemas"
echo ""
echo -e "${BLUE}Después de 48-72 horas:${NC}"
echo "  1. Login a Render Dashboard"
echo "  2. Settings → Suspend Service"
echo ""
echo -e "${BLUE}Después de 1 mes sin problemas:${NC}"
echo "  1. Render → Billing"
echo "  2. Cancelar plan / Eliminar servicios"
echo ""

read -p "Presiona ENTER para ver el resumen final..."

clear

# ═══════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════

echo -e "${BOLD}${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║           🎉 ¡Migración Completada! 🎉                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${BLUE}📊 Resumen de la migración:${NC}"
echo "──────────────────────────────────────────────────────"
echo ""

if [ -n "$DOMAIN" ]; then
    echo -e "  🌐 URL de producción: ${GREEN}https://$DOMAIN${NC}"
else
    if [ -f ".vercel-url.tmp" ]; then
        VERCEL_URL=$(cat .vercel-url.tmp)
        echo -e "  🌐 URL de producción: ${GREEN}https://$VERCEL_URL${NC}"
        rm .vercel-url.tmp
    fi
fi

echo -e "  📦 Base de datos: Configurada"
echo -e "  🔐 Variables de entorno: Configuradas"
echo -e "  🚀 Deploy: Exitoso"
echo ""
echo -e "${YELLOW}📅 Recordatorios:${NC}"
echo ""
echo "  [ ] Monitorear logs durante los próximos días"
echo "  [ ] NO apagar Render hasta 48-72 horas"
echo "  [ ] Verificar que todo funciona correctamente"
echo "  [ ] Actualizar documentación si es necesario"
echo ""
echo -e "${BLUE}📚 Recursos útiles:${NC}"
echo ""
echo "  - Vercel Dashboard: https://vercel.com/dashboard"
echo "  - Docs: https://vercel.com/docs"
echo "  - Supabase Dashboard: https://supabase.com/dashboard"
echo ""
echo -e "${GREEN}¡Gracias por usar NexoAgent! 🚀${NC}"
echo ""
