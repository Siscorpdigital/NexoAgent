import { BASELINE_EM, CAP_EM, CARGO, CENTRO_BARRA, NOMBRE } from "./config";

/**
 * Anchos de avance de Arimo (métricamente compatible con Arial), en unidades
 * por 1000 em. Permiten ajustar el tamaño del texto sin medir en el navegador,
 * de forma idéntica en el servidor y en cualquier dispositivo.
 */
const COMUNES: Record<string, number> = {
  " ": 278, "#": 556, $: 556, "%": 889, "*": 389, "+": 584, ",": 278, "-": 333,
  ".": 278, "/": 278, "<": 584, "=": 584, ">": 584, "\\": 278, _: 556, "`": 333, "~": 584,
};
for (const d of "0123456789") COMUNES[d] = 556;

function tabla(extra: Record<string, number>, letras: string): Record<string, number> {
  const t: Record<string, number> = { ...COMUNES, ...extra };
  for (const par of letras.split(" ")) t[par[0]] = Number(par.slice(1));
  return t;
}

const NEGRITA = tabla(
  { "!": 333, '"': 474, "&": 722, "'": 238, "(": 333, ")": 333, ":": 333, ";": 333, "?": 611, "@": 975, "[": 333, "]": 333, "^": 584, "{": 389, "|": 280, "}": 389 },
  "A722 B722 C722 D722 E667 F611 G778 H722 I278 J556 K722 L611 M833 N722 O778 P667 " +
    "Q778 R722 S667 T611 U722 V667 W944 X667 Y667 Z611 " +
    "a556 b611 c556 d611 e556 f333 g611 h611 i278 j278 k556 l278 m889 n611 o611 p611 " +
    "q611 r389 s556 t333 u611 v556 w778 x556 y556 z500",
);

const REGULAR = tabla(
  { "!": 278, '"': 355, "&": 667, "'": 191, "(": 333, ")": 333, ":": 278, ";": 278, "?": 556, "@": 1015, "[": 278, "]": 278, "^": 469, "{": 334, "|": 260, "}": 334 },
  "A667 B667 C722 D722 E667 F611 G778 H722 I278 J500 K667 L556 M833 N722 O778 P667 " +
    "Q778 R722 S667 T611 U722 V667 W944 X667 Y667 Z611 " +
    "a556 b556 c500 d556 e556 f278 g556 h556 i222 j222 k500 l222 m833 n556 o556 p556 " +
    "q556 r333 s500 t278 u556 v500 w722 x500 y500 z500",
);

/** Ancho de un texto en em, incluyendo el tracking. */
function anchoEm(texto: string, anchos: Record<string, number>, trackingEm: number): number {
  let total = 0;
  const chars = [...texto];
  for (const ch of chars) {
    // Letras acentuadas (á, é, ñ, ü…) tienen el mismo ancho que su letra base.
    const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    total += anchos[ch] ?? anchos[base] ?? 611;
  }
  return total / 1000 + trackingEm * chars.length;
}

export interface LineaTexto {
  texto: string;
  /** Posición superior de la caja de texto (px de la plantilla). */
  top: number;
  fontSize: number;
  letterSpacing: number;
}

export interface LayoutTarjeta {
  nombre: LineaTexto;
  cargo: LineaTexto | null;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const limpiar = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();

/**
 * Nombre en una sola línea (82 px como en el diseño, reducido solo si no cabe)
 * y, debajo, el cargo más pequeño. Con cargo, el bloque nombre + cargo queda
 * centrado sobre la barra naranja; sin cargo, el nombre queda en su posición
 * original del diseño.
 */
export function layoutTarjeta(nombreCrudo: string, cargoCrudo?: string | null): LayoutTarjeta {
  const nombre = limpiar(nombreCrudo);
  const cargo = limpiar(cargoCrudo);

  const f = Math.max(
    NOMBRE.fuenteMin,
    Math.min(NOMBRE.fuenteMax, (NOMBRE.bordeDerecho - NOMBRE.x) / Math.max(anchoEm(nombre, NEGRITA, NOMBRE.trackingEm), 0.01)),
  );
  const lineaNombre = (baseline: number): LineaTexto => ({
    texto: nombre,
    top: r1(baseline - BASELINE_EM * f),
    fontSize: r1(f),
    letterSpacing: r1(NOMBRE.trackingEm * f),
  });

  if (!cargo) {
    return { nombre: lineaNombre(NOMBRE.centroMayusculasSolo + (CAP_EM * f) / 2), cargo: null };
  }

  const c = Math.max(
    CARGO.fuenteMin,
    Math.min(
      CARGO.fuenteMax,
      f * CARGO.proporcionMax,
      (CARGO.bordeDerecho - NOMBRE.x) / Math.max(anchoEm(cargo, REGULAR, CARGO.trackingEm), 0.01),
    ),
  );
  const separacion = CARGO.separacionEm * f;
  const alto = CAP_EM * f + separacion + CAP_EM * c;
  const baselineNombre = CENTRO_BARRA - alto / 2 + CAP_EM * f;
  const baselineCargo = baselineNombre + separacion + CAP_EM * c;

  return {
    nombre: lineaNombre(baselineNombre),
    cargo: {
      texto: cargo,
      top: r1(baselineCargo - BASELINE_EM * c),
      fontSize: r1(c),
      letterSpacing: r1(CARGO.trackingEm * c),
    },
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
