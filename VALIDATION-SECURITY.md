# 🔒 Validaciones y Seguridad - NexoAgent

## ✅ Implementación Completada

Se han implementado validaciones exhaustivas usando **Zod** en todas las Server Actions del proyecto para garantizar la seguridad y consistencia de datos.

---

## 📁 Archivo de Validaciones

**Ubicación:** `/lib/validations.ts`

Este archivo centraliza todos los schemas de validación del proyecto usando Zod, incluyendo:

### Schemas Implementados

1. **Empresa**
   - `crearEmpresaSchema` - Crear nueva empresa
   - `editarEmpresaSchema` - Editar empresa existente
   - `actualizarPromptSchema` - Actualizar prompt del sistema

2. **CRM / Contactos**
   - `crearContactoSchema` - Crear contacto
   - `actualizarContactoSchema` - Actualizar contacto existente

3. **Agenda / Citas**
   - `crearCitaSchema` - Crear cita (valida fecha futura, horarios)
   - `actualizarCitaSchema` - Cambiar estado de cita

4. **Memoria Estructurada**
   - `guardarMemoriaSchema` - Agregar entrada de memoria
   - `eliminarMemoriaSchema` - Eliminar entrada

5. **Automatizaciones**
   - `crearAutomatizacionSchema` - Crear automatización
   - `actualizarAutomatizacionSchema` - Editar automatización
   - `eliminarAutomatizacionSchema` - Eliminar automatización

6. **Documentos / Conocimiento**
   - `subirDocumentoSchema` - Subir documento
   - `eliminarDocumentoSchema` - Eliminar documento

7. **Usuarios / Autenticación**
   - `crearUsuarioSchema` - Crear usuario (con validación de contraseña fuerte)
   - `loginSchema` - Login
   - `actualizarUsuarioSchema` - Actualizar usuario

---

## 🛡️ Funciones de Sanitización

### `sanitizeString(input: string)`
Elimina caracteres peligrosos para prevenir XSS:
- Remueve `<` y `>` 
- Elimina caracteres de control
- Trim espacios

### `sanitizePhone(phone: string)`
Limpia números de teléfono:
- Solo permite números y `+`
- Remueve caracteres no permitidos

### `isValidCuid(id: string)`
Valida que un ID sea un CUID válido del formato de Prisma.

### `validateData<T>(schema, data)`
Helper genérico para validar datos con manejo de errores.

---

## 🔐 Validaciones por Módulo

### Empresas (`app/actions/empresas.ts`)

✅ **Implementado:**
- Validación de nombre (2-100 caracteres)
- Validación de teléfono (10-20 dígitos, solo números y +)
- Validación de email
- Validación de ID tipo CUID
- Sanitización de todos los inputs
- Transacciones para eliminaciones en cascada
- Verificación de existencia antes de eliminar

### CRM (`app/actions/crm.ts`)

✅ **Implementado:**
- Validación de datos de contacto
- Verificación de duplicados por teléfono+empresa
- Sanitización de nombre, notas
- Validación de permisos (contacto pertenece a empresa)
- Validación de tipo de contacto (LEAD/CLIENTE/PROVEEDOR)

### Agenda (`app/actions/agenda.ts`)

✅ **Implementado:**
- Validación de fecha futura
- Validación de fin > inicio
- Validación de duración
- Sanitización de nombre, teléfono, notas
- Verificación de permisos antes de modificar/eliminar
- Validación de URL de Calendly
- Protección contra eliminación no autorizada

### Memoria (`app/actions/memoria.ts`)

✅ **Implementado:**
- Validación de categoría (PRODUCTO/HORARIO/PRECIO/POLITICA)
- Validación de clave (1-200 caracteres)
- Validación de valor (1-2000 caracteres)
- Verificación de propiedad antes de eliminar

### Automatizaciones (`app/actions/automatizaciones.ts`)

✅ **Implementado:**
- Validación de nombre (3-100 caracteres)
- Validación de trigger (PRIMER_MENSAJE/PALABRA_CLAVE/FUERA_HORARIO)
- Validación de mensaje (10-1000 caracteres)
- Sanitización de condiciones y mensajes
- Verificación de permisos

---

## 🚨 Validaciones de Contraseña

Para usuarios nuevos, se requiere:
- **Mínimo 8 caracteres**
- **Al menos 1 mayúscula**
- **Al menos 1 minúscula**  
- **Al menos 1 número**

```typescript
.regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
.regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
.regex(/[0-9]/, "La contraseña debe contener al menos un número")
```

---

## ⚠️ Manejo de Errores

Todas las Server Actions ahora:

1. **Capturan errores de validación Zod**
   ```typescript
   catch (error) {
     if (error instanceof z.ZodError) {
       console.error("Validación fallida:", error.errors);
       throw new Error(error.errors[0]?.message || "Datos inválidos");
     }
   }
   ```

2. **Registran errores en consola**
   - Útil para debugging y monitoreo
   - Incluye stack trace completo

3. **Retornan mensajes amigables**
   - No exponen detalles internos
   - Informan claramente el problema

---

## 🔍 Validaciones de Permisos

Cada acción valida que:

- ✅ El ID de empresa es válido (CUID)
- ✅ El recurso pertenece a la empresa correcta
- ✅ El usuario tiene permisos sobre ese recurso
- ✅ El recurso existe antes de modificar/eliminar

Ejemplo:
```typescript
// Verificar que el contacto pertenece a la empresa
const contacto = await prisma.contacto.findFirst({
  where: { id, empresaId },
  select: { id: true },
});

if (!contacto) {
  throw new Error("Contacto no encontrado");
}
```

---

## 📊 Límites de Caracteres

| Campo | Mínimo | Máximo |
|-------|--------|--------|
| Nombre empresa | 2 | 100 |
| Teléfono | 10 | 20 |
| Email | - | 100 |
| Prompt sistema | - | 5000 |
| Notas contacto | - | 1000 |
| Notas cita | - | 1000 |
| Clave memoria | 1 | 200 |
| Valor memoria | 1 | 2000 |
| Nombre automatización | 3 | 100 |
| Mensaje automatización | 10 | 1000 |
| Nombre documento | 3 | 200 |
| Contenido documento | 10 | 100000 |

---

## 🎯 Prevención de Ataques

### SQL Injection
✅ **Protegido** - Uso de Prisma ORM con queries parametrizadas

### XSS (Cross-Site Scripting)
✅ **Protegido** - Sanitización de `<` y `>` en todos los inputs de texto

### CUID Injection
✅ **Protegido** - Validación de formato CUID con regex

### Duplicados
✅ **Protegido** - Verificación de unicidad antes de crear (ej: teléfono+empresa)

### Unauthorized Access
✅ **Protegido** - Verificación de propiedad empresa-recurso

---

## 🔄 Próximos Pasos Recomendados

### 1. Rate Limiting (Tarea #3)
- Implementar límites en webhook de WhatsApp
- Limitar requests por IP
- Proteger endpoints públicos

### 2. Headers de Seguridad (Tarea #7)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### 3. Logging Estructurado (Tarea #8)
- Integrar Sentry para errores
- Log de acciones críticas
- Métricas de validaciones fallidas

---

## 📝 Notas de Desarrollo

- **Zod instalado:** `npm install zod` ✅
- **Imports necesarios:** Todos los actions actualizados ✅
- **Testing:** Probar formularios con datos inválidos
- **Performance:** Las validaciones Zod son muy eficientes

---

**Fecha de implementación:** Mayo 31, 2026  
**Archivos modificados:**
- `/lib/validations.ts` (nuevo)
- `/app/actions/empresas.ts`
- `/app/actions/crm.ts`
- `/app/actions/agenda.ts`
- `/app/actions/memoria.ts`
- `/app/actions/automatizaciones.ts`

**Estado:** ✅ COMPLETADO
