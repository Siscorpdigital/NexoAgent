# 🗄️ Configuración de Supabase para Producción - NexoAgent

## 📋 Pasos para Configurar Supabase

### 1. Crear Proyecto en Supabase

1. **Ir a Supabase Dashboard**
   - Visita: https://supabase.com/dashboard
   - Inicia sesión o crea una cuenta gratuita

2. **Crear Nuevo Proyecto**
   - Click en "New Project"
   - **Name:** `nexoagent-production` (o el nombre que prefieras)
   - **Database Password:** Genera una contraseña segura (guárdala en lugar seguro)
   - **Region:** Selecciona la más cercana a tus usuarios
     - `South America (São Paulo)` - Para LATAM
     - `US East (N. Virginia)` - Para USA
   - Click en "Create new project"
   - ⏰ Espera 2-3 minutos mientras se crea el proyecto

3. **Obtener Connection String**
   - Una vez creado el proyecto, ve a:
     - **Settings** (⚙️ en el sidebar izquierdo)
     - **Database**
     - Sección **Connection string**
   - Copia la **Connection string** en modo **URI**
   - Formato: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

---

## 🔑 Configurar Variables de Entorno

### Opción 1: Para Desarrollo Local con DB de Producción

Crea o actualiza `.env.local`:

```env
# Supabase Production Database
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Para Prisma Migrations (Connection Pooling deshabilitado)
DIRECT_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Resto de variables...
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
AUTH_SECRET=your_generated_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Opción 2: Para Producción (Vercel/Render)

Configurar en el panel de tu plataforma de hosting:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
```

---

## ⚙️ Actualizar Configuración de Prisma

### 1. Actualizar `prisma/schema.prisma`

Agrega la variable `directUrl` para migraciones:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. Verificar que el schema esté correcto

```bash
npx prisma validate
```

---

## 🚀 Ejecutar Migraciones

### Paso 1: Generar Cliente de Prisma

```bash
npx prisma generate
```

### Paso 2: Ejecutar Migraciones en Supabase

**IMPORTANTE:** Esto creará todas las tablas en tu base de datos de producción.

```bash
npx prisma migrate deploy
```

Este comando:
- ✅ Lee todas las migraciones de `prisma/migrations/`
- ✅ Las ejecuta en orden en Supabase
- ✅ No crea archivos nuevos (solo las aplica)

### Alternativa: Hacer Push del Schema (sin migraciones)

Si prefieres hacer push directo sin usar el sistema de migraciones:

```bash
npx prisma db push
```

⚠️ **Nota:** `db push` es más rápido pero no mantiene historial de migraciones.

---

## ✅ Verificar Conexión

### 1. Usar Prisma Studio

```bash
npx prisma studio
```

Esto abre una interfaz web en `http://localhost:5555` donde puedes:
- ✅ Ver todas las tablas creadas
- ✅ Inspeccionar el schema
- ✅ Agregar datos de prueba

### 2. Verificar desde Terminal

```bash
npx prisma db execute --stdin <<< "SELECT current_database(), current_user;"
```

Debería retornar:
```
current_database | current_user
-----------------+--------------
postgres         | postgres
```

---

## 🌱 Datos Iniciales (Opcional)

### Crear Usuario Administrador Inicial

Crea el archivo `prisma/seed-production.ts`:

```typescript
import { PrismaClient } from "@/app/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando base de datos de producción...");

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash("Admin123!", 10);
  
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@nexoagent.com" },
    update: {},
    create: {
      email: "admin@nexoagent.com",
      password: hashedPassword,
      nombre: "Administrador",
      rol: "PROVEEDOR",
    },
  });

  console.log("✅ Usuario admin creado:", admin.email);

  // Crear empresa demo
  const empresa = await prisma.empresa.upsert({
    where: { telefonoWhatsapp: "+584121234567" },
    update: {},
    create: {
      nombre: "Empresa Demo",
      telefonoWhatsapp: "+584121234567",
      email: "contacto@empresademo.com",
      promptSistema: "Eres Katy, asistente virtual profesional y amigable.",
    },
  });

  console.log("✅ Empresa demo creada:", empresa.nombre);

  // Vincular usuario con empresa
  await prisma.usuario.update({
    where: { id: admin.id },
    data: { empresaId: empresa.id },
  });

  console.log("✅ Usuario vinculado a empresa");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Ejecutar:

```bash
npx tsx prisma/seed-production.ts
```

---

## 🔒 Seguridad en Supabase

### 1. Configurar Row Level Security (Opcional)

Si quieres usar RLS de Supabase (no es necesario si usas Prisma):

```sql
-- En Supabase SQL Editor
ALTER TABLE "Empresa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
-- etc...
```

### 2. Configurar IP Whitelist (Opcional)

En **Settings → Database → Connection Pooling:**
- Puedes restringir IPs que pueden conectarse
- Útil para máxima seguridad

### 3. Backups Automáticos

Supabase hace backups automáticos:
- **Free tier:** 7 días de retención
- **Pro tier:** 30 días de retención
- Puedes restaurar desde **Database → Backups**

---

## 📊 Monitoreo

### Dashboard de Supabase

En tu proyecto, puedes ver:

1. **Database:**
   - Uso de almacenamiento
   - Queries por segundo
   - Conexiones activas

2. **Logs:**
   - Ver queries lentas
   - Errores de conexión

3. **SQL Editor:**
   - Ejecutar queries directamente
   - Exportar datos

---

## 🚨 Troubleshooting

### Error: "Can't reach database server"

**Solución:**
- Verifica que la URL de conexión sea correcta
- Verifica que la contraseña no tenga caracteres especiales sin encodear
- Usa `encodeURIComponent()` para la contraseña si tiene caracteres especiales

```javascript
const password = "my@pass!word";
const encoded = encodeURIComponent(password);
// postgresql://user:${encoded}@host:port/db
```

### Error: "Too many connections"

**Solución:**
- Usa Connection Pooling (puerto 6543)
- Verifica que `?pgbouncer=true` esté en la URL
- Aumenta el límite en Supabase (Settings → Database → Connection limit)

### Error: "Prisma migrate deploy failed"

**Solución:**
- Usa `DIRECT_URL` para migraciones (puerto 5432)
- No uses Connection Pooling para migraciones

---

## 📝 Checklist de Configuración

- [ ] Proyecto creado en Supabase
- [ ] Connection String obtenida
- [ ] Variables de entorno configuradas (`DATABASE_URL` y `DIRECT_URL`)
- [ ] `prisma/schema.prisma` actualizado con `directUrl`
- [ ] Migraciones ejecutadas (`npx prisma migrate deploy`)
- [ ] Conexión verificada (`npx prisma studio`)
- [ ] Datos iniciales sembrados (opcional)
- [ ] Backups configurados en Supabase

---

## 🎯 Siguiente Paso

Una vez configurado Supabase:

1. ✅ Base de datos lista
2. ➡️ **Siguiente:** Deploy de la aplicación en Vercel/Render
3. ➡️ Configurar variables de entorno en la plataforma
4. ➡️ Probar en producción

---

## 💡 Recursos Útiles

- **Supabase Docs:** https://supabase.com/docs
- **Prisma + Supabase:** https://www.prisma.io/docs/guides/database/supabase
- **Connection Pooling:** https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler

---

**Fecha:** Mayo 31, 2026  
**Estado:** ✅ DOCUMENTADO
