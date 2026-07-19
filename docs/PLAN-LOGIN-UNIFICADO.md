# Diseño — Login unificado (Etapa 0 · Paso 2)

> Documento de diseño. **No ejecutar a ciegas**: la autenticación es el cambio de mayor
> riesgo; debe implementarse y **probarse con la app corriendo** (login real) antes de
> mergear. Este documento deja todo definido para ejecutarlo en ese momento.

## Objetivo
Un **solo inicio de sesión** para todo el producto Previsión Familiar (cotizador + agente).
Hoy hay dos sistemas:
- **Cotizador:** Supabase Auth + tabla `profiles` (roles `agente|coordinador|admin|superadmin`
  y el permiso `acceso_nexo` ya creado). **Está en producción con usuarios reales.**
- **NexoAgent:** NextAuth (`lib/auth.ts`) + tabla `Usuario` (rol `PROVEEDOR|CLIENTE`),
  con Credentials (email/clave) y Google.

## Decisión
**Gana Supabase Auth** (la del cotizador) como única fuente de verdad de identidad y roles.
NexoAgent deja de usar NextAuth y **lee la sesión de Supabase** en el servidor. Motivos: el
cotizador ya está en producción con esos usuarios/roles, y el acceso al agente ya se controla
con el permiso `acceso_nexo` sobre `profiles`.

## Arquitectura propuesta

### 1) Reemplazar `auth()` por un lector de sesión Supabase (compatibilidad)
La app llama `await auth()` en muchos server components/actions y espera
`session.user = { id, email, name, rol, empresaId }`. Se conserva **esa misma firma** para no
reescribir cada llamada:

- Nuevo `lib/auth.ts` (o `lib/session.ts`) exporta `auth()` que:
  1. Lee el usuario de Supabase con `@supabase/ssr` (cookies del request).
  2. Carga su fila de `profiles` (rol, acceso_nexo, nombre).
  3. Devuelve `{ user: { id, email, name, rol: mapRol(profile), empresaId: EMPRESA_ID } }`
     o `null` si no hay sesión.
- **Mapa de roles** (cotizador → NexoAgent):

  | profiles.rol | ¿Accede al agente? | rol NexoAgent |
  |---|---|---|
  | superadmin | sí (por rol) | `PROVEEDOR` |
  | admin | sí (por rol) | `PROVEEDOR` |
  | coordinador | si `acceso_nexo` | `PROVEEDOR` |
  | agente | si `acceso_nexo` | `PROVEEDOR` |

  (Single-tenant: todos los autorizados son "staff" → `PROVEEDOR`. Sin `acceso_nexo` y sin
  rol admin/superadmin → sin acceso al módulo agente.)

- **`empresaId`**: como es single-tenant, siempre la única empresa "Previsión Familiar".
  Helper `getEmpresaId()` que la resuelve una vez (por env `NEXO_EMPRESA_ID` o buscando la
  única fila de `empresa`) y la cachea.

### 2) Mantener la tabla `Usuario` solo para relaciones
Muchos modelos referencian `Usuario` (tickets, mensajes de ticket, etc.). No se usa para
autenticar, pero se conserva para esas relaciones:
- Helper `ensureUsuario(supabaseUserId, profile)`: hace `upsert` de un `Usuario`
  (id = id de Supabase, email, nombre, rol `PROVEEDOR`, empresaId único) en el primer acceso.
  Así las claves foráneas siguen funcionando.

### 3) Quitar NextAuth
- Eliminar `app/api/auth/[...nextauth]/route.ts` y la config NextAuth de `lib/auth.ts`
  (providers Credentials/Google **de login**).
- El **login de Google deja de usarse para entrar**; el **OAuth de Google Calendar** es otro
  flujo (`app/api/google-calendar/*`) y **se conserva**.
- Páginas `app/login`, `app/forgot-password`, `app/reset-password` de NexoAgent: se sustituyen
  por el login del cotizador (Supabase). `/login` redirige al login unificado.
- Modelos NextAuth (`Account`, `Session`, `VerificationToken`, `PasswordResetToken`) quedan sin
  uso; se pueden dejar por ahora y limpiar después (una migración Prisma) para no arriesgar.

### 4) Protección de rutas
- El `middleware.ts` (o los layouts server) validan la sesión de Supabase y el permiso
  (`acceso_nexo` o rol admin/superadmin) para las rutas del agente; si no, redirigen al login.

## Archivos que cambian (representativos)
- `lib/auth.ts` → nuevo lector de sesión Supabase (misma firma `auth()`).
- `lib/prisma.ts` sin cambios; nuevo `lib/empresa.ts` (`getEmpresaId`), `lib/usuario-sync.ts`.
- Quitar `app/api/auth/[...nextauth]/`; ajustar `app/login`, `app/forgot-password`,
  `app/reset-password`.
- `middleware.ts` (protección con Supabase).
- Variables de entorno: añadir las de Supabase del cotizador (`NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, y `SUPABASE_SERVICE_ROLE` si hace falta leer `profiles` en server) y
  `NEXO_EMPRESA_ID`. Quitar `AUTH_SECRET`/`NEXTAUTH_URL` (NextAuth) al final.

## Verificación (OBLIGATORIA, con la app corriendo)
1. `next build` sin errores.
2. Entrar con un usuario **admin** del cotizador → accede al agente.
3. Entrar con un **agente sin `acceso_nexo`** → NO accede (redirige/oculto).
4. Entrar con un **agente con `acceso_nexo`** → accede.
5. Crear datos (contacto, conversación) → se asocian a la única empresa y al `Usuario`
   sincronizado (relaciones OK).
6. Cerrar sesión → invalida en toda la app.
7. Regresión: el cotizador sigue logueando igual.

## Dependencia
Requiere que la app esté **desplegada/ejecutable** (base de datos + credenciales). Por eso el
Paso 2 se ejecuta junto con "poner la app a correr", no antes.
