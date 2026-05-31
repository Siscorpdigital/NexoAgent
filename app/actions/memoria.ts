"use server";

import { prisma } from "@/lib/prisma";
import { CategoriaMemoria } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function agregarMemoria(formData: FormData) {
  const empresaId = formData.get("empresaId") as string;
  const categoria = formData.get("categoria") as CategoriaMemoria;
  const clave = formData.get("clave") as string;
  const valor = formData.get("valor") as string;

  if (!clave?.trim() || !valor?.trim()) return;

  await prisma.memoriaEmpresa.create({
    data: { empresaId, categoria, clave: clave.trim(), valor: valor.trim() },
  });

  revalidatePath(`/empresa/${empresaId}/memoria`);
}

export async function eliminarMemoria(formData: FormData) {
  const id = formData.get("id") as string;
  const empresaId = formData.get("empresaId") as string;

  await prisma.memoriaEmpresa.delete({ where: { id } });
  revalidatePath(`/empresa/${empresaId}/memoria`);
}
