"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { mapAcceso } from "@/lib/acceso";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowser();
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) {
        setError("Correo o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      // Verificar acceso al módulo agente antes de entrar.
      const { data: profile } = await supabase
        .from("profiles")
        .select("rol, acceso_nexo")
        .eq("id", data.user.id)
        .maybeSingle();
      const { authorized } = mapAcceso(
        profile?.rol,
        !!profile?.acceso_nexo,
      );

      if (!authorized) {
        await supabase.auth.signOut();
        setError(
          "Tu usuario no tiene acceso al Agente. Solicítalo a un administrador.",
        );
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 sm:px-6" style={{ background: "var(--bg-soft, #F4F7F6)" }}>
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Previsión Familiar"
              width={576}
              height={180}
              priority
              className="w-auto h-20 sm:h-24"
            />
          </div>
          <p className="text-gray-600 text-sm">
            Agente Virtual · Inicia sesión para continuar
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ outlineColor: "var(--ink, #2D5750)" }}
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                tabIndex={-1}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 rounded-lg transition-all duration-200 font-medium shadow-lg disabled:opacity-60"
            style={{ background: "linear-gradient(120deg,#2D5750 0%,#3D6E65 55%,#2BAA8A 100%)" }}
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          ¿Olvidaste tu contraseña? Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}
