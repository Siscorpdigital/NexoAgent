import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
