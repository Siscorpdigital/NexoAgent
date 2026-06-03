# 🛠️ Scripts de Migración - NexoAgent

Scripts automatizados para facilitar la migración de Render a Vercel.

## 🚀 Inicio Rápido

### Opción 1: Asistente Completo (RECOMENDADO)

```bash
./scripts/migrate.sh
```

Este script interactivo te guiará por **todas las 8 fases** de la migración:
1. Preparación y Backup
2. Setup de Vercel
3. Migración de Base de Datos
4. Variables de Entorno
5. Primer Deploy
6. Dominio Personalizado
7. Testing
8. Apagar Render

**Tiempo estimado:** 45-60 minutos

---

### Opción 2: Scripts Individuales

Si prefieres ejecutar cada paso manualmente:

#### 1. Backup de Base de Datos

```bash
./scripts/backup-database.sh
```

**Qué hace:**
- Crea un dump SQL de tu base de datos actual
- Guarda en `backups/backup_nexoagent_YYYYMMDD_HHMMSS.sql`
- Verifica el tamaño del archivo

**Requiere:** `pg_dump` instalado

**Cuándo usarlo:** Antes de cualquier migración

---

#### 2. Setup de Vercel

```bash
./scripts/setup-vercel.sh
```

**Qué hace:**
- Instala Vercel CLI si no está instalado
- Te ayuda a hacer login
- Conecta tu proyecto con Vercel
- Link con tu repositorio de GitHub

**Requiere:** Cuenta de Vercel

**Cuándo usarlo:** Después del backup, antes de configurar variables

---

#### 3. Generar Template de Variables

```bash
./scripts/generate-env-template.sh
```

**Qué hace:**
- Te guía para crear todas las variables necesarias
- Genera `NEXTAUTH_SECRET` automáticamente
- Crea archivo `vercel-env-template.txt` con todas las variables
- Formato listo para copiar a Vercel

**Salida:** `vercel-env-template.txt` (NO subir a GitHub)

**Cuándo usarlo:** Antes de hacer el primer deploy

---

#### 4. Test de Deployment

```bash
./scripts/test-deployment.sh
```

**Qué hace:**
- Verifica que tu deployment esté funcionando
- Tests automáticos:
  - ✅ Homepage carga (HTTP 200)
  - ✅ API responde
  - ✅ Login page existe
  - ✅ Assets estáticos
  - ✅ SSL activo
  - ✅ Tiempo de respuesta < 1s
- Checklist manual para testing en navegador

**Requiere:** URL de deployment (ej: https://nexoagent.vercel.app)

**Cuándo usarlo:** Después del primer deploy y después de configurar dominio

---

## 📋 Orden Recomendado

### Migración Completa

```bash
# 1. Backup
./scripts/backup-database.sh

# 2. Setup Vercel
./scripts/setup-vercel.sh

# 3. Configurar BD en Supabase (manual)
# https://supabase.com/dashboard

# 4. Generar variables
./scripts/generate-env-template.sh

# 5. Configurar variables en Vercel (manual)
# https://vercel.com/dashboard → Settings → Environment Variables

# 6. Deploy
vercel --prod

# 7. Test
./scripts/test-deployment.sh

# 8. Configurar dominio (manual, ver MIGRACION_VERCEL.md)

# 9. Test final
./scripts/test-deployment.sh
```

---

## 🔧 Requisitos

### Obligatorios

- **Node.js** 18+ y npm
- **Git** configurado
- **Cuenta de GitHub** con el repo
- **Cuenta de Vercel** (crear gratis)

### Opcionales

- **pg_dump** (para backup de PostgreSQL)
  ```bash
  # macOS
  brew install postgresql

  # Ubuntu/Debian
  sudo apt-get install postgresql-client
  ```

- **psql** (para restaurar backup)
  ```bash
  # macOS
  brew install postgresql

  # Ubuntu/Debian
  sudo apt-get install postgresql-client
  ```

---

## 📁 Estructura de Archivos

```
scripts/
├── README.md                      # Este archivo
├── migrate.sh                     # 🚀 Asistente completo (USAR ESTE)
├── backup-database.sh             # Backup de BD
├── setup-vercel.sh                # Setup inicial de Vercel
├── generate-env-template.sh       # Generar variables
├── test-deployment.sh             # Tests automáticos
├── check-vercel-ready.sh          # Verificar preparación
├── setup-supabase.sh              # Helper para Supabase
└── generate-vapid.js              # Generar keys VAPID
```

---

## 🆘 Troubleshooting

### Error: "pg_dump: command not found"

**Solución:**
```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql-client
```

O usa la alternativa:
```bash
DATABASE_URL="..." npx prisma migrate deploy
```

---

### Error: "vercel: command not found"

**Solución:**
```bash
npm install -g vercel
```

---

### Error: "Permission denied"

**Solución:**
```bash
chmod +x scripts/*.sh
```

---

### Backup muy lento o se cuelga

**Solución:**
```bash
# Backup solo del schema (sin datos)
pg_dump --schema-only <DATABASE_URL> > schema.sql

# O usa Prisma
npx prisma migrate dev --create-only
```

---

## 💡 Tips

### 1. Backup antes de todo

Siempre haz backup antes de cualquier cambio:
```bash
./scripts/backup-database.sh
```

### 2. No apagar Render inmediatamente

Espera **48-72 horas** después de migrar a Vercel antes de apagar Render.

### 3. Verificar variables

Usa `vercel env ls` para ver todas las variables configuradas:
```bash
vercel env ls
```

### 4. Logs en tiempo real

```bash
# Ver logs de Vercel
vercel logs --follow

# Ver logs de un deployment específico
vercel logs [deployment-url] --follow
```

### 5. Rollback si algo sale mal

```bash
# Ver deployments anteriores
vercel ls

# Promover un deployment anterior a producción
vercel promote [deployment-url]
```

---

## 📚 Documentación Adicional

- **Guía completa:** Ver `MIGRACION_VERCEL.md`
- **Checklist imprimible:** Ver `CHECKLIST_MIGRACION.md`
- **Deployment general:** Ver `DEPLOYMENT.md`

---

## 🎯 Checklist Rápido

Antes de ejecutar `migrate.sh`:

- [ ] Git commits al día (`git push`)
- [ ] Cuenta de Vercel creada
- [ ] Cuenta de Supabase creada (opcional)
- [ ] Todas las credenciales a mano (Twilio, VAPID, etc.)
- [ ] Dominio comprado (opcional, puede ser después)
- [ ] 1 hora de tiempo disponible

---

## 🤝 Soporte

Si tienes problemas:

1. Revisa la sección Troubleshooting arriba
2. Lee `MIGRACION_VERCEL.md` para detalles
3. Vercel Docs: https://vercel.com/docs
4. Vercel Support: support@vercel.com

---

**¡Buena suerte con la migración! 🚀**
