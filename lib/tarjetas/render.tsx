import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { CARGO, NOMBRE, PLANTILLA } from "./config";
import { layoutTarjeta, type LineaTexto } from "./texto";
import { qrParaTarjeta } from "./qr";

interface Recursos {
  plantilla: string;
  negrita: ArrayBuffer;
  regular: ArrayBuffer;
}

let recursos: Promise<Recursos> | null = null;

const aArrayBuffer = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

/** Lee la plantilla y las fuentes (del disco; si no están en el bundle, del propio sitio). */
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
    recursos = Promise.all([
      leer("tarjetas/plantilla.png"),
      leer("tarjetas/arimo-700.woff"),
      leer("tarjetas/arimo-400.woff"),
    ])
      .then(([png, negrita, regular]) => ({
        plantilla: `data:image/png;base64,${png.toString("base64")}`,
        negrita: aArrayBuffer(negrita),
        regular: aArrayBuffer(regular),
      }))
      .catch((error) => {
        recursos = null;
        throw error;
      });
  }
  return recursos;
}

function Linea({ linea, peso, color }: { linea: LineaTexto; peso: 400 | 700; color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: NOMBRE.x,
        top: linea.top,
        display: "flex",
        fontFamily: "Arimo",
        fontWeight: peso,
        fontSize: linea.fontSize,
        letterSpacing: linea.letterSpacing,
        lineHeight: 1,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {linea.texto}
    </div>
  );
}

/**
 * Genera la tarjeta en PNG: el diseño original con el nombre (negro, una
 * línea), el cargo (verde del logo) y el QR del empleado.
 */
export async function renderTarjeta(opts: {
  nombre: string;
  cargo?: string | null;
  urlQR: string;
  origen: string;
  headers?: Record<string, string>;
}): Promise<Response> {
  const { plantilla, negrita, regular } = await cargarRecursos(opts.origen);
  const texto = layoutTarjeta(opts.nombre, opts.cargo);
  const qr = qrParaTarjeta(opts.urlQR);
  const qrSrc = `data:image/svg+xml;base64,${Buffer.from(qr.svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: PLANTILLA.ancho, height: PLANTILLA.alto, display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={plantilla} width={PLANTILLA.ancho} height={PLANTILLA.alto} style={{ position: "absolute", left: 0, top: 0 }} />
        <Linea linea={texto.nombre} peso={700} color={NOMBRE.color} />
        {texto.cargo && <Linea linea={texto.cargo} peso={400} color={CARGO.color} />}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={qrSrc} width={qr.lado} height={qr.lado} style={{ position: "absolute", left: qr.left, top: qr.top }} />
      </div>
    ),
    {
      width: PLANTILLA.ancho,
      height: PLANTILLA.alto,
      fonts: [
        { name: "Arimo", data: negrita, weight: 700, style: "normal" },
        { name: "Arimo", data: regular, weight: 400, style: "normal" },
      ],
      headers: opts.headers,
    },
  );
}
