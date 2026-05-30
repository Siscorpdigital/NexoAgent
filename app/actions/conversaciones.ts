"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function reactivarIA(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.conversacion.update({
    where: { id },
    data: { modoHumano: false },
  });
  revalidatePath("/dashboard/conversaciones");
  revalidatePath(`/dashboard/conversaciones/${id}`);
}
