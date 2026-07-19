"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Cierra la sesión de Supabase (login unificado) y vuelve al login.
 * El inicio de sesión se hace en el cliente (app/login) con Supabase.
 */
export async function logout() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
