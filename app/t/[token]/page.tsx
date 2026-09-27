/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ORGANIZACION, RIF, urlBase, urlPublica } from "@/lib/tarjetas/config";
import { enlaceWhatsApp, parsearExtras, telefonoInternacional, urlWeb } from "@/lib/tarjetas/datos";
import { registrarEvento } from "@/lib/tarjetas/eventos";
import { tarjetaActivaPorToken } from "@/lib/tarjetas/publica";
import { qrSvg } from "@/lib/tarjetas/qr";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ preview?: string }>;
};

const SLATE = "#2D5750";
const MUTED = "#5C7872";
const TEAL = "#2BAA8A";
const LINEA = "#E5EDEB";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const t = await tarjetaActivaPorToken(token);
  return {
    title: t ? `${t.nombre} · Previsión Familiar` : "Tarjeta no disponible",
    // URL oculta: nunca debe aparecer en buscadores.
    robots: { index: false, follow: false, nocache: true },
  };
}

interface Fila {
  icono: string;
  etiqueta: string;
  valor: string;
  href: string;
  numero?: boolean;
  externo?: boolean;
}

export default async function TarjetaPublica({ params, searchParams }: Props) {
  const { token } = await params;
  const { preview } = await searchParams;
  const t = await tarjetaActivaPorToken(token);
  if (!t) notFound();

  const h = await headers();
  // Las vistas previas desde el panel de administración no cuentan como escaneo.
  if (preview !== "1") await registrarEvento(t.id, "escaneo", h);

  const url = urlPublica(urlBase(h), t.token);
  const extras = parsearExtras(t.extras);

  const filas: Fila[] = [];
  if (t.email) filas.push({ icono: "✉️", etiqueta: "Email", valor: t.email, href: `mailto:${t.email}` });
  if (t.telefono) filas.push({ icono: "📞", etiqueta: "Teléfono", valor: t.telefono, href: `tel:${telefonoInternacional(t.telefono)}`, numero: true });
  if (t.celular) filas.push({ icono: "📱", etiqueta: "Celular", valor: t.celular, href: `tel:${telefonoInternacional(t.celular)}`, numero: true });
  if (t.whatsapp) filas.push({ icono: "💬", etiqueta: "WhatsApp", valor: t.whatsapp, href: enlaceWhatsApp(t.whatsapp), numero: true, externo: true });
  for (const e of extras) {
    if (e.tipo === "email") filas.push({ icono: "✉️", etiqueta: e.etiqueta || "Email", valor: e.valor, href: `mailto:${e.valor}` });
    if (e.tipo === "telefono") filas.push({ icono: "📞", etiqueta: e.etiqueta || "Teléfono", valor: e.valor, href: `tel:${telefonoInternacional(e.valor)}`, numero: true });
    if (e.tipo === "celular") filas.push({ icono: "📱", etiqueta: e.etiqueta || "Celular", valor: e.valor, href: `tel:${telefonoInternacional(e.valor)}`, numero: true });
    if (e.tipo === "whatsapp") filas.push({ icono: "💬", etiqueta: e.etiqueta || "WhatsApp", valor: e.valor, href: enlaceWhatsApp(e.valor), numero: true, externo: true });
  }
  if (t.web) filas.push({ icono: "🌐", etiqueta: "Web", valor: t.web.replace(/^https?:\/\//i, "").replace(/\/$/, ""), href: urlWeb(t.web), externo: true });

  const llamar = t.celular || t.telefono;
  const whatsapp = t.whatsapp || t.celular;
  const acciones = [
    llamar && { icono: "📞", texto: "Llamar", href: `tel:${telefonoInternacional(llamar)}` },
    whatsapp && { icono: "💬", texto: "WhatsApp", href: enlaceWhatsApp(whatsapp), externo: true },
    t.email && { icono: "✉️", texto: "Email", href: `mailto:${t.email}` },
    t.web && { icono: "🌐", texto: "Sitio web", href: urlWeb(t.web), externo: true },
  ].filter(Boolean) as { icono: string; texto: string; href: string; externo?: boolean }[];

  const iniciales = t.nombre
    .split(/\s+/)
    .filter((p) => /^[\p{L}]/u.test(p))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#EEF4F2 0%,#F4F7F6 55%)" }}>
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-10">
        {/* Tarjeta (diseño original) */}
        <img
          src={`/t/${t.token}/tarjeta?v=${t.actualizadoEn.getTime()}`}
          width={1387}
          height={843}
          alt={`Tarjeta de presentación de ${t.nombre}`}
          className="w-full h-auto"
          style={{ filter: "drop-shadow(0 10px 22px rgba(45,87,80,.18))" }}
        />

        {/* Perfil */}
        <section className="mt-6 bg-white rounded-2xl p-5" style={{ border: `1px solid ${LINEA}`, boxShadow: "0 4px 18px rgba(45,87,80,.07)" }}>
          <div className="flex items-center gap-4">
            {t.foto ? (
              <img
                src={t.foto}
                alt={t.nombre}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                style={{ border: `3px solid ${TEAL}` }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${SLATE}, ${TEAL})` }}
              >
                {iniciales}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight" style={{ color: SLATE }}>
                {t.nombre}
              </h1>
              {t.cargo && (
                <p className="text-sm font-semibold mt-1" style={{ color: "#17817D" }}>
                  {t.cargo}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Previsión Familiar
              </p>
            </div>
          </div>

          {filas.length > 0 && (
            <ul className="mt-5">
              {filas.map((f, i) => (
                <li key={i} style={{ borderTop: i ? `1px solid ${LINEA}` : undefined }}>
                  <a
                    href={f.href}
                    {...(f.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="text-lg w-7 text-center">{f.icono}</span>
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>
                        {f.etiqueta}
                      </span>
                      <span className={`block text-sm font-medium truncate ${f.numero ? "font-roboto" : ""}`} style={{ color: SLATE }}>
                        {f.valor}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Acciones */}
        {acciones.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {acciones.map((a, i) => (
              <a
                key={a.texto}
                href={a.href}
                {...(a.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-sm font-semibold ${
                  acciones.length % 2 === 1 && i === acciones.length - 1 ? "col-span-2" : ""
                }`}
                style={{ color: SLATE, border: `1px solid ${LINEA}`, boxShadow: "0 1px 3px rgba(45,87,80,.06)" }}
              >
                <span className="text-lg">{a.icono}</span> {a.texto}
              </a>
            ))}
          </div>
        )}

        <a
          href={`/t/${t.token}/vcard`}
          className="mt-3 flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white text-base font-bold"
          style={{ background: `linear-gradient(120deg, ${SLATE}, #3D6E65, ${TEAL})`, boxShadow: "0 8px 20px rgba(43,170,138,.25)" }}
        >
          <span className="text-xl">👤</span> Guardar contacto
        </a>

        {/* Compartir */}
        <details className="mt-4 bg-white rounded-2xl" style={{ border: `1px solid ${LINEA}` }}>
          <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold" style={{ color: SLATE }}>
            Mostrar código QR para compartir
          </summary>
          <div className="px-5 pb-6">
            <div className="mx-auto w-60 h-60" dangerouslySetInnerHTML={{ __html: qrSvg(url, { margen: 2, responsivo: true }) }} />
            <p className="text-xs text-center mt-3" style={{ color: MUTED }}>
              Otra persona puede escanearlo para ver esta tarjeta.
            </p>
          </div>
        </details>

        <footer className="mt-8 text-center text-[11px]" style={{ color: "#8FA69F" }}>
          {ORGANIZACION} · RIF: {RIF}
        </footer>
      </div>
    </div>
  );
}
