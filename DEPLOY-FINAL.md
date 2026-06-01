# 🚀 Instrucciones de Deploy Final - NexoAgent

**Fecha:** 1 de Junio, 2026  
**Versión:** 1.0.0  
**Tiempo estimado:** 15-20 minutos

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener:

- ✅ **Cuenta de Vercel** (https://vercel.com)
- ✅ **Cuenta de Supabase** (https://supabase.com) o cualquier PostgreSQL
- ✅ **API Key de Anthropic** (https://console.anthropic.com)
- ✅ **Repositorio Git** (GitHub, GitLab o Bitbucket)

---

## 🗄️ Paso 1: Configurar Base de Datos (Supabase)

### 1.1 Crear Proyecto en Supabase

1. Ve a https://supabase.com/dashboard
2. Click en **"New project"**
3. Configurar:
   - **Name:** `nexoagent-prod`
   - **Database Password:** (genera uno seguro y guárdalo)
   - **Region:** Elige la más cercana a tus usuarios
4. Espera 2-3 minutos a que se cree el proyecto

### 1.2 Obtener URLs de Conexión

1. Ve a **Settings → Database**
2. Copia las siguientes URLs:

   **Para `DATABASE_URL` (Connection pooling):**
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

   **Para `DIRECT_URL` (Direct connection):**
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

3. **⚠️ IMPORTANTE:** Reemplaza `[password]` con tu contraseña real

### 1.3 Ejecutar Migraciones

```bash
# En tu máquina local, con las URLs configuradas en .env.local
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."

# Ejecutar migraciones
npx prisma migrate deploy

# Verificar
npx prisma studio
```

---

## 🔑 Paso 2: Generar AUTH_SECRET

```bash
# Generar un secret seguro de 32 bytes
openssl rand -base64 32
```

Copia el resultado, lo usarás en el siguiente paso.

---

## 🚢 Paso 3: Deploy en Vercel

### 3.1 Conectar Repositorio

1. Ve a https://vercel.com/new
2. Importa tu repositorio de Git
3. Vercel detectará automáticamente que es Next.js

### 3.2 Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega:

#### **Esenciales (mínimo para funcionar):**

```env
DATABASE_URL=postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:5432/postgres
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
AUTH_SECRET=[el secret que generaste con openssl]
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

#### **Opcionales (para WhatsApp):**

```env
WHATSAPP_VERIFY_TOKEN=nexoagent_webhook_2026
WHATSAPP_TOKEN=[token de Meta WhatsApp Business]
WHATSAPP_PHONE_NUMBER_ID=[id del número]
```

#### **Opcionales (para Google Calendar):**

```env
GOOGLE_CLIENT_ID=[tu-client-id].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[tu-client-secret]
GOOGLE_REDIRECT_URI=https://tu-dominio.vercel.app/api/google-calendar/callback
```

### 3.3 Deploy

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. ✅ Tu app estará live en `https://tu-proyecto.vercel.app`

---

## 👤 Paso 4: Crear Usuario Administrador

### Opción A: Desde Prisma Studio

```bash
# Conectar a la base de datos de producción
npx prisma studio
```

1. Ve a la tabla **"Usuario"**
2. Click en **"Add record"**
3. Llenar:
   - `id`: (genera uno en https://www.npmjs.com/package/cuid)
   - `email`: tu@email.com
   - `passwordHash`: (genera uno temporal, lo cambiarás luego)
   - `nombre`: Tu Nombre
   - `rol`: ADMIN
   - `activo`: true

### Opción B: SQL Directo en Supabase

```sql
-- En Supabase SQL Editor
INSERT INTO "Usuario" (id, email, "passwordHash", nombre, rol, activo, "creadoEn", "actualizadoEn")
VALUES (
  'cl0000000000000000001', -- Reemplaza con un CUID real
  'admin@nexoagent.com',
  '$2b$10$abcdefghijklmnopqrstuvwxyz123456', -- Hash de prueba
  'Admin',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

> **Nota:** Necesitarás cambiar la contraseña desde la interfaz después del primer login.

---

## 🏢 Paso 5: Crear Primera Empresa

1. Accede a `https://tu-dominio.vercel.app/login`
2. Inicia sesión con el usuario admin
3. Ve a **Admin → Empresas**
4. Click en **"Nueva Empresa"**
5. Llenar:
   - **Nombre:** Empresa de Prueba
   - **Email:** contacto@empresa.com
   - **Teléfono:** +5215512345678
6. Click en **"Crear"**
7. Accede al panel de la empresa

---

## 🎨 Paso 6: Configurar Prompt del Sistema

1. En el panel de la empresa, ve a **Configuración**
2. Personaliza el prompt del sistema:

```
Eres un asistente virtual profesional y amable de [NOMBRE DE TU EMPRESA].

Tu objetivo es:
- Atender consultas de clientes sobre nuestros productos/servicios
- Agendar citas de manera eficiente
- Proporcionar información precisa basada en nuestro conocimiento

Características:
- Siempre saluda con entusiasmo
- Usa emojis ocasionalmente (no abuses)
- Sé conciso pero completo
- Si no sabes algo, di que consultarás y responderás pronto
- Confirma siempre los datos importantes (nombre, fecha, hora)

Horario de atención: [TU HORARIO]
Servicios principales: [TUS SERVICIOS]
```

3. Click en **"Guardar"**

---

## 📚 Paso 7: Agregar Conocimiento (Opcional)

1. Ve a **Conocimiento**
2. Sube documentos PDF con información de tu empresa:
   - Catálogo de productos
   - Precios
   - Políticas
   - FAQs
3. El agente usará esta info para responder

---

## 📱 Paso 8: Conectar WhatsApp (Opcional)

### Requisitos
- Cuenta de Meta Business
- Número de WhatsApp verificado

### Configuración

1. Ve a https://developers.facebook.com/apps
2. Crea una app de WhatsApp Business
3. Configura el webhook:
   - **URL:** `https://tu-dominio.vercel.app/api/webhook`
   - **Verify Token:** El que pusiste en `WHATSAPP_VERIFY_TOKEN`
4. Suscríbete a:
   - `messages`
   - `messaging_postbacks`
5. Obtén el **token permanente** y el **Phone Number ID**
6. Actualiza las variables en Vercel:
   ```bash
   vercel env add WHATSAPP_TOKEN production
   vercel env add WHATSAPP_PHONE_NUMBER_ID production
   ```
7. Redeploy:
   ```bash
   vercel --prod
   ```

---

## 📅 Paso 9: Conectar Google Calendar (Opcional)

### Requisitos
- Cuenta de Google
- Proyecto en Google Cloud Console

### Configuración

1. Ve a https://console.cloud.google.com/apis/credentials
2. Crea un proyecto nuevo o usa uno existente
3. Habilita **Google Calendar API**
4. Crea credenciales **OAuth 2.0**:
   - **Application type:** Web application
   - **Authorized redirect URIs:** `https://tu-dominio.vercel.app/api/google-calendar/callback`
5. Copia el **Client ID** y **Client Secret**
6. Actualiza las variables en Vercel:
   ```bash
   vercel env add GOOGLE_CLIENT_ID production
   vercel env add GOOGLE_CLIENT_SECRET production
   vercel env add GOOGLE_REDIRECT_URI production
   ```
7. Redeploy:
   ```bash
   vercel --prod
   ```

8. En tu panel de empresa, ve a **Agenda** y click en **"Conectar Google Calendar"**

---

## ✅ Paso 10: Verificar Todo Funciona

### Checklist de Verificación

1. **✅ Login funciona**
   - Ve a `/login`
   - Inicia sesión con tu usuario admin
   - Verifica redirección a dashboard

2. **✅ Crear empresa funciona**
   - Admin → Empresas → Nueva
   - Verifica que se crea correctamente

3. **✅ Panel de empresa carga**
   - Accede al panel de la empresa
   - Verifica que todos los módulos cargan

4. **✅ API Health Check**
   ```bash
   curl https://tu-dominio.vercel.app/api/health
   # Debe retornar: {"status":"ok"}
   ```

5. **✅ Subir documento**
   - Ve a Conocimiento
   - Sube un PDF de prueba
   - Verifica que se procesa

6. **✅ Crear contacto en CRM**
   - Ve a CRM → Nuevo contacto
   - Verifica que se crea

7. **✅ Agendar cita**
   - Ve a Agenda → Nueva cita
   - Verifica que se crea correctamente

8. **✅ Crear automatización**
   - Ve a Automatizaciones
   - Crea una de prueba
   - Verifica que se guarda

9. **✅ WhatsApp (si lo configuraste)**
   - Envía un mensaje de prueba al número
   - Verifica que el webhook recibe el mensaje
   - Verifica que el agente responde

10. **✅ Google Calendar (si lo configuraste)**
    - Crea una cita desde el panel
    - Verifica que aparece en Google Calendar

---

## 🔧 Troubleshooting

### Error: "Database connection failed"
```bash
# Verificar las URLs de conexión
# Asegúrate de que:
# 1. DATABASE_URL usa el puerto 6543 (pooler)
# 2. DIRECT_URL usa el puerto 5432 (directo)
# 3. La contraseña está URL-encoded si tiene caracteres especiales
```

### Error: "Prisma Client not found"
```bash
# En Vercel, asegúrate de que:
# 1. El script "postinstall" está en package.json
# 2. Redeploy el proyecto

vercel --prod
```

### Error 500 en `/api/webhook`
```bash
# Verifica en Vercel logs:
vercel logs [deployment-url]

# Revisa que ANTHROPIC_API_KEY está configurada
# Revisa que DATABASE_URL está configurada
```

### No aparecen los estilos
```bash
# Asegúrate de que TailwindCSS está compilando
# Verifica que globals.css está importado en layout.tsx
```

---

## 📊 Monitoreo Post-Deploy

### Logs en Tiempo Real
```bash
vercel logs --follow
```

### Analytics de Vercel
1. Ve a tu proyecto en Vercel
2. Tab **"Analytics"**
3. Revisa:
   - Requests por hora
   - Errores
   - Latencia

### Base de Datos
1. Ve a Supabase Dashboard
2. Revisa:
   - Uso de CPU
   - Conexiones activas
   - Queries lentas

---

## 🎯 Próximos Pasos

1. **Personalizar branding**
   - Cambiar logo (`/public/logo.png`)
   - Actualizar colores en `globals.css`

2. **Configurar dominio propio**
   - En Vercel: Settings → Domains
   - Agregar tu dominio personalizado

3. **Configurar emails**
   - Integrar SendGrid o similar
   - Notificaciones de nuevas citas

4. **Monitoreo de errores**
   - Instalar Sentry
   - Integrar con Vercel

5. **Backups automáticos**
   - Configurar backups diarios en Supabase
   - Exportar datos periódicamente

---

## 🆘 Soporte

**Email:** perofaga@gmail.com  
**Documentación:** Ver archivos `*.md` en el repo  
**Issues:** GitHub Issues

---

## ✨ ¡Felicidades!

Tu instancia de NexoAgent está en producción y lista para atender a tus clientes 🎉

**Próximas mejoras recomendadas:**
- Rate limiting con Upstash
- Tests automatizados
- CI/CD con GitHub Actions
- Más integraciones (Slack, Telegram)

---

**Desarrollado con ❤️ usando Claude Code**
