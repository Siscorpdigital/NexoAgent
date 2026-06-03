# ⚡ Quick Start - Migración a Vercel

**¿Quieres migrar de Render a Vercel en menos de 1 hora?** Esta es tu guía express.

---

## 🎯 Lo más rápido posible

### 1️⃣ Un solo comando (45-60 min)

```bash
./scripts/migrate.sh
```

Este script interactivo hace TODO por ti:
- ✅ Backup automático de BD
- ✅ Setup de Vercel CLI
- ✅ Guía para Supabase
- ✅ Generación de variables
- ✅ Deploy a producción
- ✅ Configuración de dominio
- ✅ Tests automáticos

**Sigue las instrucciones en pantalla y listo.**

---

## 📝 Antes de empezar (5 min de prep)

### Crear cuentas (gratis)

1. **Vercel**: https://vercel.com/signup
   - Click "Continue with GitHub"
   - Autorizar

2. **Supabase** (opcional pero recomendado): https://supabase.com
   - Sign up with GitHub
   - (configurarás el proyecto durante la migración)

### Tener a mano

- [ ] Credenciales de Twilio (ACCOUNT_SID, AUTH_TOKEN)
- [ ] VAPID keys (o genera nuevas con el script)
- [ ] Dominio comprado (opcional, puede ser después)

---

## 🚀 Ejecución

### Terminal 1: Ejecutar migración

```bash
cd ~/proyectos/nexoagent
./scripts/migrate.sh
```

### Durante la ejecución

El script te pedirá:

1. **¿Hacer backup de BD?** → Sí (si tienes datos en Render)
2. **¿Tienes cuenta en Vercel?** → Sí (la creaste arriba)
3. **¿Qué hacer con BD?** → Opción 1 (Migrar a Supabase)
4. **¿Generar template de variables?** → Sí
5. **¿Desplegar ahora?** → Sí
6. **¿Configurar dominio?** → Sí/No (según prefieras)
7. **¿Ejecutar tests?** → Sí

### Tiempos por fase

| Fase | Tiempo |
|------|--------|
| 1. Preparación | 5 min |
| 2. Setup Vercel | 3 min |
| 3. Base de Datos | 10 min |
| 4. Variables | 10 min |
| 5. Deploy | 2 min |
| 6. Dominio | 20 min + DNS wait |
| 7. Testing | 5 min |
| **Total** | **~60 min** |

---

## 🎓 Tutorial Visual

### Fase 3: Supabase (la más importante)

Cuando llegues a la Fase 3, abre en paralelo:

**Tab 1: Terminal**
```bash
# Script en ejecución
./scripts/migrate.sh
```

**Tab 2: Navegador → Supabase**
1. https://supabase.com/dashboard
2. New Project
3. Name: `nexoagent-production`
4. Password: (genera una fuerte y guárdala)
5. Region: `Europe West`
6. Create

**Tab 3: Navegador → Vercel**
1. https://vercel.com/dashboard
2. (esperando para Fase 4)

---

### Fase 4: Variables de Entorno

El script generará `vercel-env-template.txt`.

**Cómo copiar a Vercel:**

1. Abre el archivo:
   ```bash
   cat vercel-env-template.txt
   ```

2. En Vercel Dashboard:
   - Settings → Environment Variables
   - Por cada variable:
     - Name: `DATABASE_URL`
     - Value: `postgresql://...` (copiar del txt)
     - Environments: ✅ Production ✅ Preview ✅ Development
     - Add

3. Repetir para TODAS las variables

---

### Fase 6: Dominio (opcional)

**Si tienes dominio:**

1. Vercel → Settings → Domains → Add
2. Escribe: `tudominio.com`
3. Vercel te muestra 2 opciones:

**Opción A: Nameservers (más simple)**
- Copia: `ns1.vercel-dns.com` y `ns2.vercel-dns.com`
- Ve a Namecheap/GoDaddy
- Domain → Nameservers → Custom DNS
- Pega las 2 nameservers
- Guarda

**Opción B: A Record**
- Ve a Namecheap/GoDaddy
- Advanced DNS → Add Record
- Type: A, Host: `@`, Value: `76.76.21.21`
- Add otro: Type: A, Host: `www`, Value: `76.76.21.21`
- Guarda

⏱️ **Espera 10-60 min** para propagación DNS

---

## ✅ Verificar que todo funciona

### Tests automáticos

El script ejecuta tests. Deberías ver:

```
1. Verificando homepage... ✅ OK (200)
2. Verificando API... ✅ OK
3. Verificando página de login... ✅ OK
4. Verificando assets estáticos... ✅ OK
5. Verificando SSL... ✅ HTTPS activo
6. Verificando tiempo de respuesta... ✅ 245ms (excelente)
```

### Tests manuales

Abre tu app en el navegador y prueba:

- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Ver conversaciones
- [ ] Crear contacto
- [ ] Enviar mensaje WhatsApp
- [ ] Notificaciones push

---

## 🎉 ¡Listo!

### URLs importantes

- **Tu app:** https://tudominio.com (o https://nexoagent.vercel.app)
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard

### Siguientes pasos

1. ⏰ **Esperar 48-72 horas**
2. ✅ **Verificar que todo está estable**
3. 🛑 **Apagar Render:**
   - Render Dashboard → Settings → Suspend Service

---

## 🆘 Si algo sale mal

### Error en Deploy

```bash
# Ver logs
vercel logs --follow

# Redeploy
vercel --prod --force
```

### Base de datos no conecta

1. Vercel → Environment Variables
2. Verificar `DATABASE_URL` está correcta
3. Test conexión:
   ```bash
   DATABASE_URL="tu_url" npx prisma migrate deploy
   ```

### Dominio no funciona

1. Verificar DNS: https://www.whatsmydns.net
2. Esperar más tiempo (puede tomar hasta 24h)
3. Verificar `NEXTAUTH_URL` en Vercel apunta al dominio correcto

---

## 📚 Más Info

- **Guía detallada:** `MIGRACION_VERCEL.md`
- **Checklist imprimible:** `CHECKLIST_MIGRACION.md`
- **Scripts individuales:** `scripts/README.md`

---

## 💰 Costos

| Servicio | Costo |
|----------|-------|
| Vercel Hobby | **$0/mes** |
| Supabase Free | **$0/mes** |
| Dominio | **~$10/año** |
| **Total inicial** | **$0/mes** |

Cuando crezcas:
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
- Total: ~$45/mes

---

**¿Listo? Ejecuta:**

```bash
./scripts/migrate.sh
```

🚀 **¡Y en menos de 1 hora estarás en Vercel!**
