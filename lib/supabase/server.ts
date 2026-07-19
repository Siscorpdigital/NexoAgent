import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para el servidor (Server Components, Server Actions, Route
 * Handlers). Lee/escribe la sesión desde las cookies del request, de modo que
 * el servidor "ve" al usuario logueado (misma identidad que el cotizador).
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // En Server Components puros no se pueden escribir cookies; se ignora.
          // En Server Actions / Route Handlers sí funciona (refresca la sesión).
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* no-op */
          }
        },
      },
    },
  );
}
