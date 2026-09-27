import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { NOMBRE, PLANTILLA } from "./config";
import { layoutNombre } from "./texto";
import { qrParaTarjeta } from "./qr";

interface Recursos {
  plantilla: string;
  fuente: ArrayBuffer;
}

let recursos: Promise<Recursos> | null = null;

/** Lee la plantilla y la fuente (del disco; si no están en el bundle, del propio sitio). */
function cargarRecursos(origen: string): Promise<Recursos> {
  if (!recursos) {
    const leer = async (rel: string): Promise<Buffer> => {
      try {
        return await readFile(path.join(process.cwd(), "public", rel));
      } catch {
        const r = await fetch(new URL(`/${rel}`, origen));
        if (!r.ok) throw new Error(`No se pudo cargar ${rel} (${r.status})`);
        return Buffer.from(await r.arrayBuffer());
      }
    };
    recursos = Promise.all([leer("tarjetas/plantilla.png"), leer("tarjetas/arimo-700.woff")])
      .then(([png, woff]) => ({
        plantilla: `data:image/png;base64,${png.toString("base64")}`,
        fuente: woff.buffer.slice(woff.byteOffset, woff.byteOffset + woff.byteLength) as ArrayBuffer,
      }))
      .catch((error) => {
        recursos = null;
        throw error;
      });
  }
  return recursos;
}

/**
 * Genera la tarjeta en PNG: el diseño original con el nombre y el QR del
 * empleado en la misma posición, tamaño y color que en el diseño.
 */
export async function renderTarjeta(opts: {
  nombre: string;
  urlQR: string;
  origen: string;
  headers?: Record<string, string>;
}): Promise<Response> {
  const { plantilla, fuente } = await cargarRecursos(opts.origen);
  const nombre = layoutNombre(opts.nombre);
  const qr = qrParaTarjeta(opts.urlQR);
  const qrSrc = `data:image/svg+xml;base64,${Buffer.from(qr.svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: PLANTILLA.ancho, height: PLANTILLA.alto, display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={plantilla} width={PLANTILLA.ancho} height={PLANTILLA.alto} style={{ position: "absolute", left: 0, top: 0 }} />
        {nombre.lineas.map((linea, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: NOMBRE.x,
              top: linea.top,
              display: "flex",
              fontFamily: "Arimo",
              fontWeight: 700,
              fontSize: nombre.fontSize,
              letterSpacing: nombre.letterSpacing,
              lineHeight: 1,
              color: NOMBRE.color,
              whiteSpace: "nowrap",
            }}
          >
            {linea.texto}
          </div>
        ))}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={qrSrc} width={qr.lado} height={qr.lado} style={{ position: "absolute", left: qr.left, top: qr.top }} />
      </div>
    ),
    {
      width: PLANTILLA.ancho,
      height: PLANTILLA.alto,
      fonts: [{ name: "Arimo", data: fuente, weight: 700, style: "normal" }],
      headers: opts.headers,
    },
  );
}
