import { prisma } from "@/lib/prisma";

/**
 * Mantiene una fila en `Usuario` (id = id de Supabase) para que las claves
 * foráneas de otros modelos (tickets, mensajes, etc.) sigan funcionando aunque
 * la autenticación real la lleve Supabase.
 *
 * Nota: NO se asigna `empresaId` porque en la BD `Usuario.empresaId` es único
 * (1 usuario por empresa) y aquí hay varios usuarios en la única empresa. El
 * `empresaId` de la sesión se resuelve aparte con getEmpresaId().
 */
export async function ensureUsuario(
  id: string,
  email: string,
  nombre: string,
): Promise<void> {
  const existing = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true },
  });
  if (existing) return;
  await prisma.usuario.create({
    data: { id, email, nombre, rol: "PROVEEDOR" },
  });
}
