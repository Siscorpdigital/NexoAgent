import QRCode from "qrcode";
import { QR } from "./config";

/** Nivel M: tolera ~15 % de daño (impresión, reflejos en pantalla). */
const NIVEL = "M" as const;

interface Matriz {
  size: number;
  oscuro: (fila: number, col: number) => boolean;
}

function matriz(texto: string): Matriz {
  const qr = QRCode.create(texto, { errorCorrectionLevel: NIVEL });
  const { size, data } = qr.modules;
  return { size, oscuro: (f, c) => !!data[f * size + c] };
}

/** Trazado SVG del QR en unidades de módulo (una sola ruta, sin costuras). */
function trazado(m: Matriz, margen = 0): string {
  let d = "";
  for (let f = 0; f < m.size; f++) {
    let c = 0;
    while (c < m.size) {
      if (!m.oscuro(f, c)) {
        c++;
        continue;
      }
      const inicio = c;
      while (c < m.size && m.oscuro(f, c)) c++;
      d += `M${inicio + margen} ${f + margen}h${c - inicio}v1h${inicio - c}z`;
    }
  }
  return d;
}

/**
 * QR para incrustar en la tarjeta: tamaño entero por módulo (bordes nítidos)
 * y centrado dentro de los corchetes del diseño.
 */
export function qrParaTarjeta(texto: string): { svg: string; lado: number; left: number; top: number } {
  const m = matriz(texto);
  const modulo = Math.max(1, Math.floor(QR.ladoMax / m.size));
  const lado = modulo * m.size;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.size} ${m.size}" width="${lado}" height="${lado}" shape-rendering="crispEdges">` +
    `<path fill="${QR.color}" d="${trazado(m)}"/></svg>`;
  return {
    svg,
    lado,
    left: Math.round(QR.centroX - lado / 2),
    top: Math.round(QR.centroY - lado / 2),
  };
}

/** QR independiente en SVG (vectorial, ideal para imprenta). */
export function qrSvg(
  texto: string,
  opciones: { margen?: number; color?: string; responsivo?: boolean } = {},
): string {
  const margen = opciones.margen ?? 4;
  const m = matriz(texto);
  const total = m.size + margen * 2;
  const tamano = opciones.responsivo
    ? `width="100%" height="100%"`
    : `width="${total * 16}" height="${total * 16}"`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" ${tamano} shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="#ffffff"/>` +
    `<path fill="${opciones.color ?? QR.color}" d="${trazado(m, margen)}"/></svg>`
  );
}

/** QR independiente en PNG. */
export function qrPng(texto: string, ancho = 1200): Promise<Buffer> {
  return QRCode.toBuffer(texto, {
    type: "png",
    errorCorrectionLevel: NIVEL,
    margin: 4,
    width: ancho,
    color: { dark: `${QR.color}ff`, light: "#ffffffff" },
  });
}
