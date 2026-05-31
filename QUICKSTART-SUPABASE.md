# ⚡ Quick Start - Supabase para NexoAgent

## 🎯 Configuración Rápida (5 minutos)

### 1. Crear Proyecto en Supabase

1. Ve a https://supabase.com/dashboard
2. Click **"New Project"**
3. Completa:
   - **Name:** nexoagent-production
   - **Database Password:** (guárdala en lugar seguro)
   - **Region:** South America (São Paulo) o el más cercano
4. Click **"Create new project"**
5. ⏰ Espera 2-3 minutos

### 2. Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** ⚙️ → **Database**
2. En **Connection string**, selecciona modo **URI**
3. Copia las dos conexiones:

**Connection Pooling (puerto 6543):**
```
postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct Connection (puerto 5432):**
```
postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 3. Configurar Variables de Entorno

Crea `.env.local` con tus credenciales:

```bash
# Supabase Database
DATABASE_URL="postgresql://postgres.[REF]:[TU-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[TU-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Anthropic AI
ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxx"

# NextAuth
AUTH_SECRET="genera_con_openssl_rand_base64_32"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Ejecutar Setup Automático

```bash
# Opción 1: Script automático (recomendado)
./scripts/setup-supabase.sh

# Opción 2: Paso a paso manual
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed-production.ts
```

### 5. Verificar

```bash
# Abrir Prisma Studio
npx prisma studio
```

Deberías ver:
- ✅ Todas las tablas creadas
- ✅ Usuario admin
- ✅ Empresa demo
- ✅ Datos iniciales

### 6. Probar la App

```bash
npm run dev
```

Accede a http://localhost:3000/login

**Credenciales:**
- Email: `admin@nexoagent.com`
- Password: `Admin123!`

---

## 🚀 Deploy a Producción

### Vercel

1. Conecta tu repo a Vercel
2. Agrega variables de entorno:
   ```
   DATABASE_URL=tu_connection_pooling_url
   DIRECT_URL=tu_direct_connection_url
   ANTHROPIC_API_KEY=tu_api_key
   AUTH_SECRET=tu_secret
   NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
   ```
3. Deploy automático

### Render

Ver guía completa: `DEPLOY-RENDER.md`

---

## 📊 Verificar en Supabase Dashboard

1. **Table Editor:**
   - Ver todas las tablas creadas
   - Inspeccionar datos

2. **SQL Editor:**
   ```sql
   SELECT COUNT(*) FROM "Usuario";
   SELECT COUNT(*) FROM "Empresa";
   SELECT COUNT(*) FROM "MemoriaEmpresa";
   ```

3. **Database → Logs:**
   - Ver queries ejecutadas
   - Monitorear performance

---

## 🆘 Troubleshooting

### "Can't reach database server"
- ✅ Verifica que la URL esté completa
- ✅ Verifica que la contraseña sea correcta
- ✅ Verifica que el proyecto de Supabase esté activo

### "Too many connections"
- ✅ Usa Connection Pooling (puerto 6543)
- ✅ Verifica que `?pgbouncer=true` esté en DATABASE_URL

### "Migration failed"
- ✅ Usa DIRECT_URL para migraciones
- ✅ No uses Connection Pooling para migrate

---

## 📚 Docs Completas

- Guía completa: `SUPABASE-SETUP.md`
- Variables de entorno: `.env.production.example`
- Deploy: `DEPLOYMENT.md`

---

✅ **Listo!** Tu base de datos Supabase está configurada y lista para producción.
