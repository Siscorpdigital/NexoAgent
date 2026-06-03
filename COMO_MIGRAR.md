# 🚀 Cómo Migrar a Vercel - Instrucciones de Uso

**¡Todo está listo para que migres de Render a Vercel en menos de 1 hora!**

---

## 🎯 ¿Qué tengo disponible?

He automatizado **TODO** lo que es posible automatizar. Tienes:

### 📦 Scripts Automatizados

1. **`pre-migration-check.sh`** - Verifica que estés listo
2. **`migrate.sh`** - Asistente interactivo completo (⭐ EL PRINCIPAL)
3. **`backup-database.sh`** - Backup de PostgreSQL
4. **`setup-vercel.sh`** - Setup de Vercel CLI
5. **`generate-env-template.sh`** - Generar variables de entorno
6. **`test-deployment.sh`** - Tests automáticos

### 📚 Documentación

1. **`QUICKSTART_MIGRACION.md`** - Guía express (<1 hora)
2. **`MIGRACION_VERCEL.md`** - Guía completa paso a paso
3. **`CHECKLIST_MIGRACION.md`** - Checklist imprimible
4. **`scripts/README.md`** - Docs de cada script

---

## ⚡ Uso Rápido (Recomendado)

### Opción 1: Todo Automatizado

```bash
# 1. Verifica que estás listo (2 min)
./scripts/pre-migration-check.sh

# 2. Ejecuta la migración (45-60 min)
./scripts/migrate.sh
```

**¡Eso es todo!** El script `migrate.sh` es interactivo y te guía por:
- ✅ Backup automático de BD
- ✅ Login en Vercel
- ✅ Creación de proyecto en Supabase
- ✅ Generación de variables de entorno
- ✅ Deploy a producción
- ✅ Configuración de dominio
- ✅ Tests automáticos

---

## 📋 Uso Paso a Paso (Avanzado)

Si prefieres control manual:

### 1. Pre-Check (5 min)

```bash
./scripts/pre-migration-check.sh
```

Esto verifica:
- Git configurado
- Node.js >= 18
- Dependencias instaladas
- Credenciales disponibles

---

### 2. Backup de BD (5 min)

```bash
./scripts/backup-database.sh
```

Guarda en: `backups/backup_nexoagent_YYYYMMDD_HHMMSS.sql`

---

### 3. Setup Vercel (3 min)

```bash
./scripts/setup-vercel.sh
```

Instala Vercel CLI y te ayuda a hacer login.

---

### 4. Crear Proyecto en Supabase (10 min)

**Manual en navegador:**

1. Ir a: https://supabase.com/dashboard
2. New Project
   - Name: `nexoagent-production`
   - Password: (genera una segura)
   - Region: `Europe West`
3. Esperar 2-3 minutos
4. Settings → Database → Copiar Connection String

---

### 5. Generar Variables de Entorno (10 min)

```bash
./scripts/generate-env-template.sh
```

Esto crea `vercel-env-template.txt` con todas tus variables.

**Copiar a Vercel:**

1. https://vercel.com/dashboard
2. Tu proyecto → Settings → Environment Variables
3. Copiar una por una desde `vercel-env-template.txt`
4. Marcar los 3 environments (Production, Preview, Development)

---

### 6. Deploy (2 min)

```bash
vercel --prod
```

Espera 2-3 minutos. Vercel te dará una URL.

---

### 7. Tests (5 min)

```bash
./scripts/test-deployment.sh
```

Ingresa tu URL y ejecuta tests automáticos.

---

### 8. Configurar Dominio (30 min)

**Si tienes dominio propio:**

1. Vercel → Settings → Domains → Add
2. Ingresa tu dominio
3. Sigue las instrucciones de DNS
4. Espera 10-60 min para propagación

Ver [Guía de Dominio](MIGRACION_VERCEL.md#6%EF%B8%8F⃣-dominio-personalizado)

---

## 🎓 ¿Cuál opción usar?

| Perfil | Opción Recomendada |
|--------|-------------------|
| **Primera vez migrando** | `migrate.sh` (automatizado) |
| **Quieres entender cada paso** | Manual paso a paso |
| **Tienes experiencia** | Manual + scripts individuales |
| **Solo quieres velocidad** | `migrate.sh` (automatizado) |

---

## 💡 Tips Importantes

### 1. NO apagar Render inmediatamente

Después de migrar a Vercel:
- ✅ Espera **48-72 horas**
- ✅ Monitorea logs: `vercel logs --follow`
- ✅ Verifica que todo funciona
- ❌ NO elimines Render todavía (rollback plan)

### 2. Dominio es opcional

Puedes migrar primero y configurar dominio después.
- URL temporal de Vercel: `nexoagent-xxxx.vercel.app`
- Funciona perfectamente para testing

### 3. Variables de entorno

**MUY IMPORTANTE:**
- Marcar SIEMPRE los 3 environments (Production, Preview, Development)
- No olvidar actualizar `NEXTAUTH_URL` cuando tengas dominio

### 4. Backup antes de todo

Siempre hacer backup antes de cualquier cambio:
```bash
./scripts/backup-database.sh
```

### 5. Logs en tiempo real

Ver qué está pasando en Vercel:
```bash
vercel logs --follow
```

---

## 🆘 Si algo sale mal

### Error en deploy

```bash
# Ver logs detallados
vercel logs --follow

# Forzar rebuild
vercel --prod --force
```

### Base de datos no conecta

1. Vercel → Environment Variables
2. Verificar `DATABASE_URL` correcta
3. Test manual:
   ```bash
   DATABASE_URL="tu_url" npx prisma migrate deploy
   ```

### Dominio no funciona

1. Verificar DNS: https://www.whatsmydns.net
2. Puede tomar hasta 24h (usual: 10-60 min)
3. Verificar `NEXTAUTH_URL` en Vercel

### Rollback a Render

Si necesitas volver:
1. Vercel NO afecta tu Render (están separados)
2. Solo actualiza variables en Render
3. Cambia DNS de vuelta (si configuraste dominio)

---

## 📊 Checklist de Éxito

Después de la migración, verifica:

- [ ] Homepage carga correctamente
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Ver empresas
- [ ] Ver conversaciones
- [ ] Crear contacto de prueba
- [ ] Enviar mensaje WhatsApp
- [ ] Notificaciones push funcionan
- [ ] (Si configuraste) Dominio resuelve correctamente

---

## 📞 Recursos de Ayuda

### Documentación

- [Quick Start](QUICKSTART_MIGRACION.md) - Guía express
- [Guía Completa](MIGRACION_VERCEL.md) - Todos los detalles
- [Checklist](CHECKLIST_MIGRACION.md) - Para imprimir
- [Scripts README](scripts/README.md) - Docs de scripts

### Soporte Externo

- Vercel Docs: https://vercel.com/docs
- Vercel Support: support@vercel.com
- Supabase Docs: https://supabase.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions

---

## 🎯 Siguiente Paso

**¿Listo para empezar?**

```bash
./scripts/migrate.sh
```

**⏱️ Tiempo estimado: 45-60 minutos**

---

## 📈 Beneficios de Migrar a Vercel

| Antes (Render) | Después (Vercel) |
|----------------|------------------|
| $15-20/mes | **$0/mes** (gratis para empezar) |
| Builds lentos (3-5 min) | **30 segundos** |
| Cold starts | **Siempre activo** |
| Deploy manual | **Auto-deploy** desde GitHub |
| Sin analytics | **Analytics avanzado** |

---

**¡Buena suerte con la migración! 🚀**

*Si tienes alguna duda, revisa las guías o contacta soporte.*
