import { prisma } from "@/lib/prisma";

/**
 * Single-tenant: existe una sola Empresa ("Previsión Familiar"). Este helper
 * resuelve su id (cacheado en memoria) y, si aún no existe, la crea junto con
 * su Plan ilimitado — de forma idempotente (upsert por claves únicas), para no
 * depender de correr el seed manualmente.
 */
let _cachedEmpresaId: string | null = null;

const TELEFONO_PLACEHOLDER = "+584121234567";
const PLAN_NOMBRE = "Previsión Familiar (Ilimitado)";

async function bootstrapEmpresa(): Promise<string> {
  const plan = await prisma.plan.upsert({
    where: { nombre: PLAN_NOMBRE },
    update: {},
    create: {
      nombre: PLAN_NOMBRE,
      descripcion: "Plan interno sin límites",
      precio: 0,
      maxWhatsApps: -1,
      maxAgentes: -1,
      maxConversacionesMes: -1,
      maxDocumentosMB: -1,
      transferenciaAgentes: true,
      ruteoInteligente: true,
      analyticsAvanzados: true,
      apiPersonalizada: true,
      soportePrioritario: true,
      horariosPersonalizados: true,
      visible: false,
      orden: 0,
    },
  });

  const empresa = await prisma.empresa.upsert({
    where: { telefonoWhatsapp: TELEFONO_PLACEHOLDER },
    update: { planId: plan.id },
    create: {
      nombre: "Previsión Familiar",
      telefonoWhatsapp: TELEFONO_PLACEHOLDER,
      email: "contacto@previsionfamiliar.com.ve",
      responsable: "Administrador",
      planId: plan.id,
      promptSistema:
        "Eres el asistente virtual de Previsión Familiar, C.A. Eres amable, " +
        "profesional y cercano. Atiendes consultas sobre planes de previsión y " +
        "servicios funerarios, orientas sobre coberturas, afiliación y formas de " +
        "pago, agendas citas y derivas a un asesor humano cuando sea necesario. " +
        "Respondes en español, claro, cálido y conciso.",
    },
  });

  return empresa.id;
}

export async function getEmpresaId(): Promise<string> {
  if (_cachedEmpresaId) return _cachedEmpresaId;
  if (process.env.NEXO_EMPRESA_ID) {
    _cachedEmpresaId = process.env.NEXO_EMPRESA_ID;
    return _cachedEmpresaId;
  }
  const existing = await prisma.empresa.findFirst({ select: { id: true } });
  _cachedEmpresaId = existing ? existing.id : await bootstrapEmpresa();
  return _cachedEmpresaId;
}
