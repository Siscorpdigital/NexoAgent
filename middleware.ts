import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

/**
 * Protege las rutas privadas del agente con la sesión de Supabase (login
 * unificado). Chequeo ligero (sin Prisma) para poder correr como middleware:
 *   - Sin sesión              → /login
 *   - Con sesión sin acceso   → /cotizador (usuario del cotizador sin permiso)
 *   - /admin solo admin/superadmin
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, acceso_nexo")
    .eq("id", user.id)
    .maybeSingle();

  const r = (profile?.rol || "").toLowerCase();
  const esAdmin = r === "admin" || r === "superadmin";
  const autorizado =
    esAdmin ||
    ((r === "coordinador" || r === "agente") && !!profile?.acceso_nexo);

  if (!autorizado) {
    // Usuario válido del cotizador pero sin permiso para el agente.
    return NextResponse.redirect(new URL("/cotizador", req.url));
  }

  if (pathname.startsWith("/admin") && !esAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  // Solo las rutas privadas del agente pasan por aquí.
  matcher: ["/dashboard/:path*", "/admin/:path*", "/empresa/:path*"],
};
