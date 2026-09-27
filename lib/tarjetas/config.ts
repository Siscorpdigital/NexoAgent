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

/** Distancia del tope de la caja de texto a la línea base, en em (Arimo). */
export const BASELINE_EM = 0.8293;
/** Altura de mayúsculas de Arimo, en em. */
export const CAP_EM = 0.688;
/** Centro vertical de la barra naranja del diseño: el bloque de texto se alinea con ella. */
export const CENTRO_BARRA = 464;

/**
 * Nombre: Arimo Bold (métricas de Arial), en negro y siempre en una sola
 * línea. A 82 px el nombre de ejemplo ocupa el mismo ancho y alto que en la
 * imagen original; si un nombre no cabe antes de la curva, se reduce.
 */
export const NOMBRE = {
  x: 153,
  /** Sin cargo, el nombre queda exactamente donde estaba en el diseño. */
  centroMayusculasSolo: 462,
  /** Límite derecho antes de la curva naranja. */
  bordeDerecho: 940,
  fuenteMax: 82,
  fuenteMin: 26,
  trackingEm: -0.033,
  color: "#111111",
} as const;

/**
 * Cargo: debajo del nombre, Arimo Regular en el verde de la "P" del logo
 * (#17817D, contraste AA sobre blanco) y siempre más pequeño que el nombre.
 */
export const CARGO = {
  fuenteMax: 44,
  /** Nunca más del 56 % del tamaño del nombre. */
  proporcionMax: 0.56,
  fuenteMin: 20,
  trackingEm: 0.005,
  /** Espacio entre la línea base del nombre y el tope del cargo, en em del nombre. */
  separacionEm: 0.37,
  /** Más a la izquierda que el nombre: la curva naranja baja hacia ese lado. */
  bordeDerecho: 900,
  color: "#17817D",
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
