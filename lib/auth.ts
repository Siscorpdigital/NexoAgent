import { cache } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getEmpresaId } from "@/lib/empresa";
import { ensureUsuario } from "@/lib/usuario-sync";
import { mapAcceso, type RolNexo } from "@/lib/acceso";

export { mapAcceso };
export type { RolNexo };

/**
 * Login unificado (U2): la identidad y los roles vienen de Supabase Auth +
 * tabla `profiles` (la misma del cotizador). NexoAgent ya NO usa NextAuth para
 * autenticar; `auth()` conserva la firma que esperan los server components y
 * actions:  session.user = { id, email, name, rol, empresaId }.
 *
 * Acceso al módulo agente:
 *   - superadmin / admin  → acceso por rol.
 *   - coordinador / agente → acceso solo si profiles.acceso_nexo = true.
 *   - resto → sin acceso (rol CLIENTE; el middleware lo redirige).
 * Todos los autorizados operan como PROVEEDOR (staff, single-tenant).
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  rol: RolNexo;
  empresaId: string | null;
  /** true si tiene acceso al módulo agente (admin/superadmin o acceso_nexo). */
  authorized: boolean;
  /** true si es admin o superadmin (para opciones de administración). */
  esAdmin: boolean;
}

export interface Session {
  user: SessionUser;
}

/**
 * Devuelve la sesión del usuario o `null` si no hay sesión de Supabase.
 * Cacheada por request (react cache) para no repetir consultas.
 */
export const auth = cache(async (): Promise<Session | null> => {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // select("*") en vez de columnas puntuales: así la consulta no falla (400) si
  // alguna columna opcional (p. ej. acceso_nexo) aún no existe en `profiles`.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { authorized, rol, esAdmin } = mapAcceso(
    profile?.rol,
    !!profile?.acceso_nexo,
  );
  const name = profile?.nombre || user.email?.split("@")[0] || "Usuario";

  let empresaId: string | null = null;
  if (authorized) {
    try {
      empresaId = await getEmpresaId();
    } catch {
      /* sin empresa configurada: se resolverá al hacer seed */
    }
    try {
      await ensureUsuario(user.id, user.email ?? "", name);
    } catch {
      /* no bloquear el acceso por un fallo de sincronización */
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      name,
      rol,
      empresaId,
      authorized,
      esAdmin,
    },
  };
});
