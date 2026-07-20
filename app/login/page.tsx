"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { mapAcceso } from "@/lib/acceso";

/**
 * Login unificado (final): NexoAgent NO tiene formulario propio de login.
 * El usuario inicia sesión una sola vez en el cotizador (Supabase). Como el
 * cotizador y NexoAgent viven en el mismo dominio, comparten localStorage:
 * aquí leemos esa sesión (clave "pf_supa_session"), verificamos que sea
 * admin/superadmin/autorizado y la "puenteamos" a las cookies que usa NexoAgent.
 * Si no hay sesión válida, se redirige al cotizador para iniciar sesión.
 */
export default function LoginBridgePage() {
  const [estado, setEstado] = useState<
    "verificando" | "sin_acceso" | "sin_sesion"
  >("verificando");

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      // Cliente que lee la MISMA sesión que guardó el cotizador (localStorage).
      const cotizadorClient = createClient(url, anon, {
        auth: {
          storageKey: "pf_supa_session",
          persistSession: true,
          autoRefreshToken: true,
        },
      });

      const {
        data: { session },
      } = await cotizadorClient.auth.getSession();

      if (!session) {
        if (!cancelado) {
          setEstado("sin_sesion");
          setTimeout(() => {
            window.location.replace("/cotizador");
          }, 1500);
        }
        return;
      }

      // Verificar acceso al agente (admin/superadmin o acceso_nexo).
      const { data: profile } = await cotizadorClient
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      const { authorized } = mapAcceso(profile?.rol, !!profile?.acceso_nexo);

      if (!authorized) {
        if (!cancelado) setEstado("sin_acceso");
        return;
      }

      // Puente: escribir la sesión en las cookies que usa NexoAgent (SSR).
      const nexoClient = createSupabaseBrowser();
      await nexoClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (!cancelado) window.location.replace("/dashboard");
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-soft, #F4F7F6)" }}
    >
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 text-center">
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.png"
            alt="Previsión Familiar"
            width={480}
            height={150}
            priority
            className="w-auto h-16"
          />
        </div>

        {estado === "verificando" && (
          <>
            <div
              className="mx-auto mb-4 w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#2BAA8A", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "#5C7872" }}>
              Verificando tu acceso al Agente…
            </p>
          </>
        )}

        {estado === "sin_acceso" && (
          <>
            <p className="text-base font-semibold mb-2" style={{ color: "#2D5750" }}>
              Sin acceso al Agente
            </p>
            <p className="text-sm mb-5" style={{ color: "#5C7872" }}>
              Tu usuario no tiene permiso para el Agente Virtual. Solicítalo a un
              administrador.
            </p>
            <a
              href="/cotizador"
              className="inline-block px-5 py-2.5 rounded-lg text-white text-sm font-medium"
              style={{ background: "#2D5750" }}
            >
              Volver al cotizador
            </a>
          </>
        )}

        {estado === "sin_sesion" && (
          <>
            <p className="text-base font-semibold mb-2" style={{ color: "#2D5750" }}>
              Inicia sesión en el cotizador
            </p>
            <p className="text-sm" style={{ color: "#5C7872" }}>
              Te llevamos al inicio de sesión…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
