/**
 * Tarjetas de presentación digitales de Previsión Familiar.
 *
 * La tarjeta es la imagen de diseño original (public/tarjetas/plantilla.png,
 * 1387×843) con el nombre de ejemplo y el QR de ejemplo borrados. Sobre ella
 * solo se dibujan el nombre y el QR de cada empleado, en la misma posición,
 * tamaño y color que tenían en el diseño.
 */

export const ORGANIZACION = "Previsión Familiar y Asociados, C.A.";
export const RIF = "J-402246722";

export const PLANTILLA = { ancho: 1387, alto: 843 } as const;

/**
 * Nombre: Arimo Bold (métricas de Arial), calibrado píxel a píxel contra el
 * diseño: a 82 px el nombre de ejemplo ocupa exactamente el mismo ancho y alto
 * que en la imagen original.
 */
export const NOMBRE = {
  x: 153,
  /** Centro vertical de las mayúsculas (alineado con la barra naranja). */
  centroMayusculas: 462,
  /** Límite derecho antes de la curva naranja. */
  bordeDerecho: 928,
  fuenteMax: 82,
  /** Por debajo de este tamaño en una línea, el nombre pasa a dos líneas. */
  fuenteMin: 60,
  fuenteMax2Lineas: 66,
  trackingEm: -0.033,
  /** Distancia del tope de la caja de texto a la línea base, en em. */
  baselineEm: 0.8293,
  /** Altura de mayúsculas de Arimo Bold, en em. */
  capEm: 0.688,
  color: "#374748",
} as const;

/** QR: centrado dentro de los corchetes del diseño. */
export const QR = {
  centroX: 1185.5,
  centroY: 642.5,
  ladoMax: 206,
  color: "#3B4A4C",
} as const;

/**
 * URL base pública para los QR. Si se define TARJETAS_URL_BASE (p. ej.
 * https://www.previsionfamiliar.com.ve) se usa siempre esa; si no, el dominio
 * desde el que se hace la petición.
 */
export function urlBase(h: Headers): string {
  const env = process.env.TARJETAS_URL_BASE || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.trim().replace(/\/+$/, "");
  const host = (h.get("x-forwarded-host") || h.get("host") || "localhost:3000").split(",")[0].trim();
  const proto =
    (h.get("x-forwarded-proto") || "").split(",")[0].trim() ||
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export function urlPublica(base: string, token: string): string {
  return `${base}/t/${token}`;
}
