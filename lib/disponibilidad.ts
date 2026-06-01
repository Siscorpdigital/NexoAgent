import { prisma } from "./prisma";

export async function verificarDisponibilidad(
  empresaId: string,
  fecha: string,
  hora: string,
  duracion: number
): Promise<{ disponible: boolean; conflictos: string[] }> {
  const inicio = new Date(`${fecha}T${hora}:00`);
  const fin = new Date(inicio.getTime() + duracion * 60 * 1000);

  // Buscar citas que se solapan con este horario
  const citasConflicto = await prisma.cita.findMany({
    where: {
      empresaId,
      estado: { not: "CANCELADA" },
      OR: [
        // La nueva cita empieza durante una cita existente
        {
          AND: [
            { inicio: { lte: inicio } },
            { fin: { gt: inicio } },
          ],
        },
        // La nueva cita termina durante una cita existente
        {
          AND: [
            { inicio: { lt: fin } },
            { fin: { gte: fin } },
          ],
        },
        // La nueva cita cubre completamente una cita existente
        {
          AND: [
            { inicio: { gte: inicio } },
            { fin: { lte: fin } },
          ],
        },
      ],
    },
    select: {
      nombreCliente: true,
      inicio: true,
      fin: true,
    },
  });

  if (citasConflicto.length === 0) {
    return { disponible: true, conflictos: [] };
  }

  const conflictos = citasConflicto.map((cita) => {
    const horaInicio = cita.inicio.toTimeString().substring(0, 5);
    const horaFin = cita.fin.toTimeString().substring(0, 5);
    return `${horaInicio}-${horaFin} (${cita.nombreCliente})`;
  });

  return { disponible: false, conflictos };
}

export async function sugerirHorarios(
  empresaId: string,
  fecha: string,
  duracion: number,
  preferencia?: "mañana" | "tarde" | "noche"
): Promise<string[]> {
  // Obtener horarios de la empresa de la memoria
  const horarios = await prisma.memoriaEmpresa.findMany({
    where: {
      empresaId,
      categoria: "HORARIO",
    },
  });

  // Horarios por defecto si no hay configurados (9am - 6pm, lunes a viernes)
  let horaApertura = 9;
  let horaCierre = 18;

  // Intentar parsear horarios de la memoria
  for (const h of horarios) {
    const match = h.valor.match(/(\d+):?(\d{2})?\s*(?:am|AM|pm|PM)?\s*-\s*(\d+):?(\d{2})?\s*(?:am|AM|pm|PM)?/);
    if (match) {
      horaApertura = parseInt(match[1]);
      horaCierre = parseInt(match[3]);
      if (match[1].includes("pm") || parseInt(match[1]) < 8) horaApertura += 12;
      if (match[3].includes("pm") || parseInt(match[3]) < 8) horaCierre += 12;
    }
  }

  // Obtener todas las citas del día
  const inicioDelDia = new Date(fecha);
  inicioDelDia.setHours(0, 0, 0, 0);
  const finDelDia = new Date(fecha);
  finDelDia.setHours(23, 59, 59, 999);

  await prisma.cita.findMany({
    where: {
      empresaId,
      estado: { not: "CANCELADA" },
      inicio: {
        gte: inicioDelDia,
        lte: finDelDia,
      },
    },
    orderBy: { inicio: "asc" },
  });

  // Generar slots de 30 minutos
  const sugerencias: string[] = [];
  let horaActual = horaApertura;

  // Definir rangos según preferencia
  let rangoInicio = horaApertura;
  let rangoFin = horaCierre;

  if (preferencia === "mañana") {
    rangoInicio = Math.max(horaApertura, 8);
    rangoFin = Math.min(horaCierre, 12);
  } else if (preferencia === "tarde") {
    rangoInicio = Math.max(horaApertura, 12);
    rangoFin = Math.min(horaCierre, 18);
  } else if (preferencia === "noche") {
    rangoInicio = Math.max(horaApertura, 18);
    rangoFin = horaCierre;
  }

  while (horaActual < rangoFin) {
    const hora = `${horaActual.toString().padStart(2, "0")}:00`;
    const resultado = await verificarDisponibilidad(empresaId, fecha, hora, duracion);

    if (resultado.disponible && horaActual >= rangoInicio) {
      sugerencias.push(hora);
      if (sugerencias.length >= 3) break; // Máximo 3 sugerencias
    }

    horaActual += 0.5; // Incrementar 30 minutos
  }

  return sugerencias;
}

export function determinarPreferencia(texto: string): "mañana" | "tarde" | "noche" | undefined {
  const lower = texto.toLowerCase();
  if (lower.includes("mañana") || lower.includes("temprano") || lower.match(/\b(9|10|11)\s*(am|de la mañana)/)) {
    return "mañana";
  }
  if (lower.includes("tarde") || lower.match(/\b(12|1|2|3|4|5)\s*(pm|de la tarde)/)) {
    return "tarde";
  }
  if (lower.includes("noche") || lower.match(/\b(6|7|8|9)\s*(pm|de la noche)/)) {
    return "noche";
  }
  return undefined;
}
