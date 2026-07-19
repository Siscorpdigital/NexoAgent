import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  // Enrutado del dominio Previsión Familiar (un solo dominio para todo):
  //  - "/"           → landing pública de marketing (public/inicio.html), como antes.
  //  - "/cotizador"  → cotizador estático (asesores), como antes.
  //  - El resto de rutas (/login, /dashboard, /admin, …) las maneja NexoAgent.
  // Se usa `beforeFiles` para que "/" muestre la landing ANTES que la ruta de la app
  // (app/page.tsx), que de lo contrario redirige a /dashboard.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/inicio.html" },
        { source: "/cotizador", destination: "/cotizador/Cotizador.html" },
        { source: "/cotizador/", destination: "/cotizador/Cotizador.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  // Headers de seguridad HTTP
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Previene ataques de clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Previene MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Protección XSS en navegadores antiguos
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Control de referrer para privacidad
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy - restringe APIs del navegador
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Content Security Policy (CSP)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // jsdelivr y cdnjs los usa el cotizador (supabase-js y html2pdf).
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              // Supabase (auth/datos + realtime) lo usan el cotizador y, más adelante, el agente.
              "connect-src 'self' https://api.anthropic.com https://www.googleapis.com https://oauth2.googleapis.com https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
