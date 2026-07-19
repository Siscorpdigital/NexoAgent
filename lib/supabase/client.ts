import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para el navegador. Guarda la sesión en cookies (no en
 * localStorage), para que el servidor pueda leerla en el siguiente request.
 * Se usa en el formulario de login.
 */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
