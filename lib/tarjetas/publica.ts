import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { tokenValido } from "./datos";

/** Tarjeta activa por token (la URL oculta). null si no existe o está desactivada. */
export const tarjetaActivaPorToken = cache(async (token: string) => {
  if (!tokenValido(token)) return null;
  const t = await prisma.tarjetaDigital.findUnique({ where: { token } });
  return t && t.activa ? t : null;
});
