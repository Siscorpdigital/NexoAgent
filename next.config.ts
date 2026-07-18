import type { NextConfig } from "next";

// Orígenes autorizados a EMBEBER esta app en un iframe (p. ej. el panel del
// cotizador de Previsión Familiar). Se configuran con la variable de entorno
// COTIZADOR_ORIGIN en Vercel, p. ej.:
//   COTIZADOR_ORIGIN="https://app.tudominio.com"
// Se aceptan varios orígenes separados por espacio o coma.
// Si la variable NO está definida, se mantiene el bloqueo total (comportamiento
// original anti-clickjacking): frame-ancestors 'none' + X-Frame-Options: DENY.
const embedOrigins = (process.env.COTIZADOR_ORIGIN || "")
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter(Boolean);

const frameAncestors =
  embedOrigins.length > 0
    ? `frame-ancestors 'self' ${embedOrigins.join(" ")}`
    : "frame-ancestors 'none'";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  // Headers de seguridad HTTP
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Previene clickjacking. X-Frame-Options no admite lista de orígenes,
          // por eso solo se envía cuando NO se autoriza el embebido; cuando sí,
          // el control fino lo hace la CSP (frame-ancestors), más moderna.
          ...(embedOrigins.length === 0
            ? [{ key: "X-Frame-Options", value: "DENY" }]
            : []),
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline requerido por Next.js
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.anthropic.com https://www.googleapis.com https://oauth2.googleapis.com",
              frameAncestors,
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
