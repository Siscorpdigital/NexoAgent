import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface AdminTarjetas {
  id: string;
  email: string;
  rol: string;
}

const ROLES_PERMITIDOS = ["admin", "superadmin"];

/**
 * Autoriza a un Admin o Superadmin de Previsión Familiar. Acepta el token de
 * sesión del cotizador (cabecera Authorization: Bearer) o, si no viene, la
 * sesión por cookies. Devuelve el usuario o una Response 401/403 lista para
 * retornar desde la ruta.
 */
export async function autorizarAdmin(req: Request): Promise<AdminTarjetas | Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return Response.json({ error: "Autenticación no configurada." }, { status: 500 });
  }

  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];

  let usuario: { id: string; email?: string } | null = null;
  let rol = "";

  try {
    if (bearer) {
      const sb = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      });
      const { data } = await sb.auth.getUser(bearer);
      usuario = data.user;
      if (usuario) {
        const { data: perfil } = await sb.from("profiles").select("*").eq("id", usuario.id).maybeSingle();
        rol = String(perfil?.rol || "").toLowerCase();
      }
    } else {
      const sb = await createSupabaseServer();
      const { data } = await sb.auth.getUser();
      usuario = data.user;
      if (usuario) {
        const { data: perfil } = await sb.from("profiles").select("*").eq("id", usuario.id).maybeSingle();
        rol = String(perfil?.rol || "").toLowerCase();
      }
    }
  } catch {
    usuario = null;
  }

  if (!usuario) return Response.json({ error: "Sesión no válida. Inicia sesión de nuevo." }, { status: 401 });
  if (!ROLES_PERMITIDOS.includes(rol)) {
    return Response.json({ error: "Solo Admin y Superadmin pueden gestionar tarjetas." }, { status: 403 });
  }
  return { id: usuario.id, email: usuario.email ?? "", rol };
}
