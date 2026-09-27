import { ORGANIZACION, RIF } from "./config";
import { telefonoInternacional, urlWeb, type ContactoExtra } from "./datos";

export interface DatosVCard {
  nombre: string;
  cargo?: string | null;
  email?: string | null;
  telefono?: string | null;
  celular?: string | null;
  whatsapp?: string | null;
  web?: string | null;
  foto?: string | null;
  extras: ContactoExtra[];
}

function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Pliega líneas a 75 octetos (RFC 2425), respetando caracteres UTF-8. */
function plegar(linea: string): string {
  const enc = new TextEncoder();
  if (enc.encode(linea).length <= 75) return linea;
  const partes: string[] = [];
  let actual = "";
  let bytes = 0;
  let limite = 75;
  for (const ch of linea) {
    const b = enc.encode(ch).length;
    if (bytes + b > limite) {
      partes.push(actual);
      actual = "";
      bytes = 0;
      limite = 74; // las continuaciones empiezan con un espacio
    }
    actual += ch;
    bytes += b;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

/** "Rohely C. Fajardo G." → apellidos "Fajardo G.", nombres "Rohely C.". */
function partesNombre(nombre: string): { apellidos: string; nombres: string } {
  const p = nombre.trim().split(/\s+/);
  if (p.length === 1) return { apellidos: "", nombres: p[0] };
  if (p.length === 2) return { apellidos: p[1], nombres: p[0] };
  return { apellidos: p.slice(-2).join(" "), nombres: p.slice(0, -2).join(" ") };
}

/**
 * vCard 3.0 (la versión que mejor importan iPhone y Android). Al abrirla, el
 * teléfono muestra directamente la opción de añadir el contacto.
 */
export function construirVCard(d: DatosVCard): string {
  const L: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  const { apellidos, nombres } = partesNombre(d.nombre);
  L.push(`N:${esc(apellidos)};${esc(nombres)};;;`);
  L.push(`FN:${esc(d.nombre)}`);
  L.push(`ORG:${esc(ORGANIZACION)}`);
  if (d.cargo) L.push(`TITLE:${esc(d.cargo)}`);

  let item = 1;
  const etiquetado = (valor: string, etiqueta: string) => {
    L.push(`item${item}.TEL:${valor}`, `item${item}.X-ABLabel:${esc(etiqueta)}`);
    item++;
  };

  const tel = telefonoInternacional(d.telefono);
  const cel = telefonoInternacional(d.celular);
  const wa = telefonoInternacional(d.whatsapp);
  if (tel) L.push(`TEL;TYPE=WORK,VOICE:${tel}`);
  if (cel) L.push(`TEL;TYPE=CELL,VOICE:${cel}`);
  if (wa && wa !== cel) etiquetado(wa, "WhatsApp");
  if (d.email) L.push(`EMAIL;TYPE=INTERNET,WORK:${esc(d.email)}`);

  for (const e of d.extras) {
    if (e.tipo === "email") {
      L.push(`EMAIL;TYPE=INTERNET:${esc(e.valor)}`);
      continue;
    }
    const num = telefonoInternacional(e.valor);
    if (!num) continue;
    if (e.tipo === "whatsapp") etiquetado(num, e.etiqueta || "WhatsApp");
    else if (e.etiqueta) etiquetado(num, e.etiqueta);
    else L.push(`TEL;TYPE=${e.tipo === "celular" ? "CELL" : "WORK"},VOICE:${num}`);
  }

  if (d.web) L.push(`URL:${esc(urlWeb(d.web))}`);

  const foto = d.foto?.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
  if (foto && foto[1] !== "webp") {
    L.push(`PHOTO;ENCODING=b;TYPE=${foto[1] === "png" ? "PNG" : "JPEG"}:${foto[2]}`);
  }

  L.push(`NOTE:${esc(`${ORGANIZACION} · RIF ${RIF}`)}`);
  L.push("END:VCARD");
  return L.map(plegar).join("\r\n") + "\r\n";
}
