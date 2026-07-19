import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRol = req.auth?.user?.rol;

  // Rutas públicas
  if (pathname === "/login" || pathname.startsWith("/api/webhook") || pathname === "/api/health") {
    return NextResponse.next();
  }

  // Redirigir a login si no está autenticado
  if (!isLoggedIn && (pathname.startsWith("/dashboard") || pathname.startsWith("/empresa") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Solo PROVEEDOR puede acceder a /admin
  if (pathname.startsWith("/admin") && userRol !== "PROVEEDOR") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // El middleware de autenticación corre SOLO en las rutas privadas del agente.
  // La landing pública ("/"), el cotizador ("/cotizador") y el login ("/login")
  // quedan fuera para que NUNCA pasen por NextAuth (así lo público no depende del
  // agente y no puede romperse por su autenticación).
  matcher: ["/dashboard/:path*", "/admin/:path*", "/empresa/:path*"],
};
