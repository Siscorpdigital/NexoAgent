# 🚀 Quickstart: Deploy NexoAgent en Render

## Paso 1: Preparar el repositorio (ya hecho ✅)

```bash
# Verificar que los cambios estén commiteados
git status

# Si hay cambios pendientes, hacer commit
git add -A
git commit -m "feat: módulo Agenda listo para producción"

# Push a main
git push origin main
```

## Paso 2: Ejecutar migraciones en Render

### Opción A: Desde el Shell de Render (Recomendado)

1. Ve a tu Web Service en Render: https://dashboard.render.com
2. Click en la pestaña **"Shell"** (arriba a la derecha)
3. Ejecuta:
   ```bash
   npx prisma migrate deploy
   ```
4. Deberías ver:
   ```
   Applying migration `20260531002627_agregar_agenda`
   Migration applied successfully
   ```

### Opción B: Desde tu computadora local

1. Ve a tu base de datos en Render
2. Copia el **External Database URL** (no el Internal)
3. En tu terminal local:
   ```bash
   DATABASE_URL="postgresql://nexoagent:PASSWORD@dpg-xxxxx.oregon-postgres.render.com/nexoagent" npx prisma migrate deploy
   ```

## Paso 3: Forzar re-deploy (si es necesario)

Si ya tenías la app deployada y solo actualizaste el código:

1. Ve a tu Web Service > **Manual Deploy**
2. Click en **"Clear build cache & deploy"**
3. Espera 3-5 minutos

## Paso 4: Verificar que funciona

### Verificación rápida en browser:

1. **Dashboard**: `https://tu-app.onrender.com/dashboard`
   - Debe cargar sin errores

2. **Health check**: `https://tu-app.onrender.com/api/health`
   - Debe mostrar: `{"status":"ok","timestamp":"..."}`

3. **Agenda de una empresa**:
   - Ve a: `https://tu-app.onrender.com/dashboard/empresas`
   - Click en una empresa
   - En el menú lateral, verifica que aparezca **"Agenda"**
   - Click en Agenda
   - Debe mostrar la interfaz del calendario

### Verificación con script (opcional):

```bash
./scripts/verify-production.sh https://tu-app.onrender.com
```

## Paso 5: Crear una cita de prueba

1. Ve al módulo **Agenda** de una empresa
2. Llena el formulario:
   - **Nombre**: Cliente Prueba
   - **Teléfono**: 5215512345678
   - **Fecha/hora**: Mañana a las 10:00 AM
   - **Duración**: 60 min
3. Click en **"Crear cita"**
4. Debe aparecer en "Próximas citas"

## Troubleshooting

### ❌ Error: "Relation 'Cita' does not exist"
**Causa**: Las migraciones no se ejecutaron.

**Solución**: Ejecuta las migraciones (Paso 2)

### ❌ Error: "Build failed"
**Causa**: Errores de TypeScript o dependencias.

**Solución**: 
```bash
# En tu local, verifica que el build funcione
npm run build

# Si funciona local pero no en Render, limpia cache:
# Render Dashboard > Manual Deploy > Clear build cache & deploy
```

### ❌ El módulo Agenda no aparece en el menú
**Causa**: El código nuevo no se deployó.

**Solución**:
1. Verifica que el commit esté en `main`: `git log --oneline -1`
2. Ve a Render > Events, debe aparecer el deploy reciente
3. Si no, haz un deploy manual

### ❌ Base de datos "connection refused"
**Causa**: DATABASE_URL incorrecta o base de datos pausada (Free tier).

**Solución**:
1. Verifica que la base de datos esté **activa** (no suspendida)
2. Usa **Internal Database URL** en las variables de entorno
3. Formato correcto: `postgresql://user:pass@dpg-xxxxx-a/dbname`

## Checklist completo

- [ ] Git push de los últimos cambios
- [ ] Migraciones ejecutadas (`npx prisma migrate deploy`)
- [ ] Deploy completado en Render
- [ ] Dashboard carga correctamente
- [ ] Módulo Agenda aparece en el menú lateral
- [ ] Puedes crear una cita de prueba
- [ ] La cita aparece en "Próximas citas"
- [ ] Puedes confirmar/cancelar citas

## Variables de entorno necesarias

Verifica que estén configuradas en **Render > Environment**:

```env
✅ DATABASE_URL=postgresql://...           (Auto-generada por Render DB)
✅ ANTHROPIC_API_KEY=sk-ant-api03-...
✅ WHATSAPP_VERIFY_TOKEN=tu_token
✅ WHATSAPP_TOKEN=tu_meta_token            (opcional si no usas WhatsApp aún)
✅ WHATSAPP_PHONE_NUMBER_ID=123456         (opcional)
✅ NODE_ENV=production
```

## Logs útiles

Para debuggear problemas:

```bash
# Ver logs en tiempo real
# Render Dashboard > Logs tab
```

Busca por:
- `Error:` - Errores de aplicación
- `Prisma` - Problemas con base de datos
- `Migration` - Estado de migraciones

---

**¡Listo!** Tu módulo Agenda debería estar activo en producción. 🎉

Si sigues teniendo problemas, revisa el archivo `DEPLOYMENT.md` para troubleshooting más detallado.
