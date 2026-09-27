import { NOMBRE } from "./config";

/**
 * Anchos de avance de Arimo Bold (métricamente compatible con Arial Bold), en
 * unidades por 1000 em. Permiten ajustar el tamaño del nombre sin medir en el
 * navegador, de forma idéntica en el servidor y en cualquier dispositivo.
 */
const ANCHOS: Record<string, number> = {
  " ": 278, "!": 333, '"': 474, "#": 556, $: 556, "%": 889, "&": 722, "'": 238,
  "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
  ":": 333, ";": 333, "<": 584, "=": 584, ">": 584, "?": 611, "@": 975,
  "[": 333, "\\": 278, "]": 333, "^": 584, _: 556, "`": 333,
  "{": 389, "|": 280, "}": 389, "~": 584,
};
for (const d of "0123456789") ANCHOS[d] = 556;
for (const par of (
  "A722 B722 C722 D722 E667 F611 G778 H722 I278 J556 K722 L611 M833 N722 O778 P667 " +
  "Q778 R722 S667 T611 U722 V667 W944 X667 Y667 Z611 " +
  "a556 b611 c556 d611 e556 f333 g611 h611 i278 j278 k556 l278 m889 n611 o611 p611 " +
  "q611 r389 s556 t333 u611 v556 w778 x556 y556 z500"
).split(" ")) {
  ANCHOS[par[0]] = Number(par.slice(1));
}

function anchoCaracter(ch: string): number {
  if (ANCHOS[ch] !== undefined) return ANCHOS[ch];
  // Letras acentuadas (á, é, ñ, ü…) tienen el mismo ancho que su letra base.
  const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return ANCHOS[base] ?? 611;
}

/** Ancho de un texto en em, incluyendo el tracking del diseño. */
function anchoEm(texto: string): number {
  let total = 0;
  const chars = [...texto];
  for (const ch of chars) total += anchoCaracter(ch);
  return total / 1000 + NOMBRE.trackingEm * chars.length;
}

export interface LineaNombre {
  texto: string;
  /** Posición superior de la caja de texto (px de la plantilla). */
  top: number;
}

export interface LayoutNombre {
  fontSize: number;
  letterSpacing: number;
  lineas: LineaNombre[];
}

const redondear = (n: number) => Math.round(n * 10) / 10;

/**
 * Calcula tamaño y posición del nombre. Con nombres de largo normal se usa
 * exactamente el tamaño del diseño (82 px); si no cabe antes de la curva se
 * reduce, y con nombres muy largos se reparte en dos líneas. Siempre queda
 * centrado verticalmente con la barra naranja, igual que en el diseño.
 */
export function layoutNombre(nombreCrudo: string): LayoutNombre {
  const nombre = nombreCrudo.replace(/\s+/g, " ").trim();
  const disponible = NOMBRE.bordeDerecho - NOMBRE.x;

  const unaLinea = (texto: string, size: number): LayoutNombre => {
    const baseline = NOMBRE.centroMayusculas + (NOMBRE.capEm * size) / 2;
    return {
      fontSize: redondear(size),
      letterSpacing: redondear(NOMBRE.trackingEm * size),
      lineas: [{ texto, top: redondear(baseline - NOMBRE.baselineEm * size) }],
    };
  };

  const f1 = Math.min(NOMBRE.fuenteMax, disponible / Math.max(anchoEm(nombre), 0.01));
  if (f1 >= NOMBRE.fuenteMin || !nombre.includes(" ")) {
    return unaLinea(nombre, Math.max(f1, 24));
  }

  // Dos líneas: se corta en el espacio que deja las líneas más parejas.
  const palabras = nombre.split(" ");
  let mejor = { l1: nombre, l2: "", ancho: Infinity };
  for (let i = 1; i < palabras.length; i++) {
    const l1 = palabras.slice(0, i).join(" ");
    const l2 = palabras.slice(i).join(" ");
    const ancho = Math.max(anchoEm(l1), anchoEm(l2));
    if (ancho < mejor.ancho) mejor = { l1, l2, ancho };
  }
  const size = Math.max(Math.min(NOMBRE.fuenteMax2Lineas, disponible / mejor.ancho), 24);
  const interlinea = size * 1.12;
  const baseline1 = NOMBRE.centroMayusculas + (NOMBRE.capEm * size - interlinea) / 2;
  const baseline2 = baseline1 + interlinea;
  return {
    fontSize: redondear(size),
    letterSpacing: redondear(NOMBRE.trackingEm * size),
    lineas: [
      { texto: mejor.l1, top: redondear(baseline1 - NOMBRE.baselineEm * size) },
      { texto: mejor.l2, top: redondear(baseline2 - NOMBRE.baselineEm * size) },
    ],
  };
}

/** Versión ASCII para nombres de archivo: "Rohely C. Fajardo G." → "rohely-c-fajardo-g". */
export function slugArchivo(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tarjeta"
  );
}
