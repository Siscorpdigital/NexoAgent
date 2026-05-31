# 🚀 Deploy en Vercel - Paso a Paso Interactivo

Vamos a deployar NexoAgent juntos. Sigue cada paso exactamente.

---

## ✅ PASO 0: Preparación (5 minutos)

### 0.1 Verificar que tengas las credenciales necesarias

Antes de empezar, necesitas tener a mano:

- [ ] **Email y Password de GitHub** (donde está tu repo)
- [ ] **Connection String de Supabase** 
  - Formato: `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
- [ ] **API Key de Anthropic**
  - Formato: `sk-ant-api03-xxxxxxxxxxxxx`

### 0.2 Generar AUTH_SECRET

Abre tu terminal y ejecuta:

```bash
openssl rand -base64 32
```

Copia el resultado. Se verá algo como:
```
K8mX2pQ9rL4nT6vB3cD5eF7gH9jK1mN4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hI4jK
```

**Guárdalo en un lugar seguro** (lo usaremos en el Paso 3).

### 0.3 Push a GitHub (si no lo has hecho)

```bash
# Verificar estado
git status

# Si hay cambios, commitear
git add -A
git commit -m "ready for deploy"

# Push a GitHub
git push origin main
```

---

## 📍 PASO 1: Ir a Vercel (1 minuto)

### 1.1 Abrir navegador

Abre tu navegador preferido (Chrome, Firefox, Safari)

### 1.2 Ir a Vercel

Escribe en la barra de direcciones:
```
https://vercel.com
```

### 1.3 Login o Sign Up

**Si ya tienes cuenta:**
- Click en **"Login"** (esquina superior derecha)
- Selecciona **"Continue with GitHub"**
- Autoriza el acceso si te lo pide

**Si NO tienes cuenta:**
- Click en **"Sign Up"** 
- Selecciona **"Continue with GitHub"**
- Autoriza el acceso
- Completa tu perfil (nombre, etc.)

---

## 📦 PASO 2: Importar Proyecto (2 minutos)

### 2.1 Crear Nuevo Proyecto

Una vez dentro del dashboard de Vercel:

1. Busca el botón **"Add New..."** (esquina superior derecha)
2. Click en **"Add New..."**
3. En el menú desplegable, selecciona **"Project"**

### 2.2 Seleccionar Repositorio

Verás una lista de tus repositorios de GitHub:

1. Busca **"nexoagent"** (o el nombre de tu repositorio)
2. Si no lo ves, click en **"Adjust GitHub App Permissions"** y da acceso
3. Una vez visible, click en **"Import"** junto a nexoagent

### 2.3 Configurar Proyecto

Verás una pantalla de configuración:

**Configure Project:**

1. **Project Name:** Déjalo como `nexoagent` o cámbialo si quieres
   
2. **Framework Preset:** Debe decir **"Next.js"** (detectado automáticamente)
   - Si no, selecciónalo manualmente

3. **Root Directory:** Déjalo en `./` (por defecto)

4. **Build and Output Settings:**
   - Click en **"Override"** al lado de **Build Command**
   - Cambia a: `prisma generate && next build`
   - Los demás déjalos como están

**NO HAGAS CLICK EN DEPLOY TODAVÍA**

---

## 🔐 PASO 3: Configurar Variables de Entorno (5 minutos)

### 3.1 Expandir Environment Variables

En la misma pantalla de configuración:

1. Busca la sección **"Environment Variables"**
2. Si está colapsada, expándela

### 3.2 Agregar DATABASE_URL

1. En el campo **"Key"**, escribe: `DATABASE_URL`
2. En el campo **"Value"**, pega tu Connection String de Supabase
   - Ejemplo: `postgresql://postgres.abcdefgh:tu_password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
3. Verifica que los 3 checkboxes estén marcados:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Click en **"Add"**

### 3.3 Agregar ANTHROPIC_API_KEY

1. En el campo **"Key"**, escribe: `ANTHROPIC_API_KEY`
2. En el campo **"Value"**, pega tu API Key de Anthropic
   - Ejemplo: `sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxx`
3. Verifica que los 3 checkboxes estén marcados
4. Click en **"Add"**

### 3.4 Agregar AUTH_SECRET

1. En el campo **"Key"**, escribe: `AUTH_SECRET`
2. En el campo **"Value"**, pega el código que generaste en el Paso 0.2
   - Ejemplo: `K8mX2pQ9rL4nT6vB3cD5eF7gH9jK1mN4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hI4jK`
3. Verifica que los 3 checkboxes estén marcados
4. Click en **"Add"**

### 3.5 Agregar NEXT_PUBLIC_APP_URL (temporal)

1. En el campo **"Key"**, escribe: `NEXT_PUBLIC_APP_URL`
2. En el campo **"Value"**, escribe: `https://nexoagent.vercel.app`
   - **NOTA:** Esto es temporal. Lo actualizaremos después con tu URL real
3. Verifica que los 3 checkboxes estén marcados
4. Click en **"Add"**

### 3.6 Verificar Variables

Deberías ver 4 variables agregadas:
- ✅ DATABASE_URL
- ✅ ANTHROPIC_API_KEY
- ✅ AUTH_SECRET
- ✅ NEXT_PUBLIC_APP_URL

---

## 🚀 PASO 4: Deploy (3 minutos)

### 4.1 Iniciar Deploy

1. Scroll hasta abajo de la página
2. Click en el botón azul grande **"Deploy"**

### 4.2 Esperar

Verás una pantalla con logs en tiempo real:

1. **Building:** Vercel está compilando tu proyecto
   - Verás logs de npm install
   - Verás logs de prisma generate
   - Verás logs de next build
2. **⏰ Esto toma 2-3 minutos**
3. NO cierres la ventana

### 4.3 Success!

Cuando termine, verás:
- 🎉 Confeti cayendo
- ✅ Mensaje "Deployment Ready"
- Una URL tipo: `https://nexoagent-xxxxxx.vercel.app`

**Copia esta URL** - la necesitaremos

---

## 🗄️ PASO 5: Ejecutar Migraciones de Base de Datos (2 minutos)

**IMPORTANTE:** Las migraciones NO se ejecutan automáticamente. Debes hacerlo manualmente.

### 5.1 Abrir Terminal en tu Computadora

```bash
# Ir a la carpeta del proyecto
cd /Users/luisdanielfajardomoreno/proyectos/nexoagent
```

### 5.2 Ejecutar Migraciones

```bash
npx prisma migrate deploy
```

Deberías ver:
```
✔ Migrations: XX applied
✔ Database schema up to date
```

### 5.3 Sembrar Datos Iniciales (Solo Primera Vez)

```bash
npx tsx prisma/seed-production.ts
```

Deberías ver:
```
🌱 Sembrando base de datos de producción...
✅ Usuario administrador creado:
   Email: admin@nexoagent.com
   Password: Admin123!
✅ Empresa demo creada
✅ Memoria estructurada inicial creada
✅ Automatizaciones iniciales creadas
🎉 ¡Base de datos sembrada exitosamente!
```

---

## ✅ PASO 6: Verificar el Deploy (2 minutos)

### 6.1 Abrir la Aplicación

1. Ve a la URL que copiaste en el Paso 4.3
   - Ejemplo: `https://nexoagent-xxxxxx.vercel.app`
2. Deberías ver la página de login de NexoAgent con:
   - ✅ Logo de NexoAgent
   - ✅ Formulario de login
   - ✅ Gradiente de fondo
   - ✅ Elementos decorativos

### 6.2 Probar Login

1. En el formulario de login, ingresa:
   - **Email:** `admin@nexoagent.com`
   - **Password:** `Admin123!`
2. Click en **"Iniciar sesión"**

### 6.3 Verificar Dashboard

Deberías ver:
- ✅ Dashboard de NexoAgent
- ✅ Logo en el sidebar
- ✅ Menú de navegación
- ✅ Panel de empresa demo

**Si ves todo esto: ¡ÉXITO! 🎉**

---

## 🔧 PASO 7: Actualizar URL de la App (1 minuto)

### 7.1 Copiar tu URL Real

Tu URL real de Vercel es algo como:
```
https://nexoagent-abc123.vercel.app
```

Cópiala exactamente.

### 7.2 Actualizar Variable de Entorno

1. En Vercel, ve a tu proyecto
2. Click en **"Settings"** (pestaña superior)
3. Click en **"Environment Variables"** (menú lateral)
4. Busca `NEXT_PUBLIC_APP_URL`
5. Click en los 3 puntos **"..."** → **"Edit"**
6. Cambia el valor a tu URL real (sin barra final):
   ```
   https://nexoagent-abc123.vercel.app
   ```
7. Click en **"Save"**

### 7.3 Redeploy

1. Ve a **"Deployments"** (pestaña superior)
2. En el deployment más reciente, click en **"..."** → **"Redeploy"**
3. Confirma
4. Espera ~2 minutos

---

## 🎯 PASO 8: Configurar Dominio (Opcional)

### Si tienes un dominio propio (ej: nexoagent.com):

1. En Vercel, ve a **"Settings"** → **"Domains"**
2. Click en **"Add"**
3. Ingresa tu dominio: `nexoagent.com`
4. Sigue las instrucciones para configurar DNS
5. Espera propagación (5-60 minutos)

### Si NO tienes dominio:

- Puedes usar la URL de Vercel: `https://nexoagent-xxx.vercel.app`
- Funciona perfectamente
- Puedes comprar un dominio después en Namecheap, GoDaddy, etc.

---

## 📊 PASO 9: Verificar en Supabase (1 minuto)

### 9.1 Abrir Supabase

1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto de NexoAgent

### 9.2 Verificar Tablas

1. Click en **"Table Editor"** (menú lateral)
2. Deberías ver todas las tablas:
   - ✅ Usuario
   - ✅ Empresa
   - ✅ Contacto
   - ✅ Conversacion
   - ✅ Mensaje
   - ✅ Documento
   - ✅ DocumentoChunk
   - ✅ MemoriaEmpresa
   - ✅ Automatizacion
   - ✅ Cita

### 9.3 Verificar Datos

1. Click en **"Usuario"**
2. Deberías ver 1 usuario: `admin@nexoagent.com`
3. Click en **"Empresa"**
4. Deberías ver 1 empresa: `Empresa Demo`

---

## 🎉 PASO 10: ¡Listo! (Testing Final)

### 10.1 Prueba Completa

Ve a tu aplicación y prueba:

1. **Login/Logout**
   - Login con admin@nexoagent.com
   - Logout
   - Login de nuevo

2. **Navegación**
   - Click en cada sección del menú
   - Inicio
   - Conversaciones
   - CRM
   - Conocimiento
   - Memoria
   - Automatizaciones
   - Agenda
   - Analíticas

3. **Crear Algo**
   - Ve a Memoria
   - Agrega una entrada de prueba
   - Verifica que se guarde

### 10.2 Cambiar Contraseña del Admin

**IMPORTANTE:** Cambia la contraseña por seguridad

1. Ve a **"Mi Cuenta"**
2. Cambia la contraseña de `Admin123!` a una más segura
3. Guarda

---

## 📝 Checklist Final

- [ ] Proyecto importado en Vercel
- [ ] 4 variables de entorno configuradas
- [ ] Deploy completado (sin errores)
- [ ] Migraciones ejecutadas en Supabase
- [ ] Datos iniciales sembrados
- [ ] Login funciona
- [ ] Logo se muestra
- [ ] Dashboard carga correctamente
- [ ] NEXT_PUBLIC_APP_URL actualizada
- [ ] Contraseña del admin cambiada
- [ ] Tablas visibles en Supabase

---

## 🚨 Troubleshooting

### Error: "Build failed"

**Solución:**
1. Ve a Vercel → Deployments → Click en el deployment fallido
2. Lee los logs de error
3. Verifica que Build Command sea: `prisma generate && next build`

### Error: "Can't connect to database"

**Solución:**
1. Verifica DATABASE_URL en Environment Variables
2. Debe tener puerto **6543** (pooling)
3. Debe terminar con `?pgbouncer=true`

### Error: "Login no funciona"

**Solución:**
1. Verifica que ejecutaste `npx tsx prisma/seed-production.ts`
2. Verifica en Supabase que existe el usuario admin
3. Verifica que AUTH_SECRET esté configurado

### La aplicación carga pero no se ve el logo

**Solución:**
1. Espera 1-2 minutos (assets cargando)
2. Ctrl+F5 (hard refresh)
3. Verifica que logo.png esté en tu repositorio

---

## 📞 ¿Necesitas Ayuda?

Si te atoras en algún paso:

1. Lee los logs de error en Vercel
2. Verifica las variables de entorno
3. Consulta DEPLOY-VERCEL.md para más detalles

---

## 🎊 ¡Felicidades!

**NexoAgent está en PRODUCCIÓN** 🚀

**Tu aplicación está disponible en:**
```
https://tu-url.vercel.app
```

**Acceso admin:**
- Email: admin@nexoagent.com  
- Password: (la que configuraste)

---

**Próximos pasos opcionales:**
1. Configurar WhatsApp Business webhook
2. Configurar Google Calendar OAuth
3. Agregar más usuarios/empresas
4. Personalizar prompt del sistema

¡Disfruta de NexoAgent! 🎉
