import { resetPassword } from "@/app/actions/password-reset";
import Image from "next/image";
import Link from "next/link";
import PasswordInput from "@/app/components/PasswordInput";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string };
}) {
  if (!searchParams.token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Token no válido
            </h2>
            <p className="text-gray-600 mb-6">
              El link de recuperación no es válido o ha expirado.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium"
            >
              Solicitar nuevo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="NexoAgent"
              width={576}
              height={180}
              priority
              className="w-auto h-36"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Restablecer contraseña
          </h2>
          <p className="text-gray-600 text-sm">
            Ingresa tu nueva contraseña
          </p>
        </div>

        {searchParams.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{searchParams.error}</p>
          </div>
        )}

        <form action={resetPassword} className="space-y-6">
          <input type="hidden" name="token" value={searchParams.token} />

          <PasswordInput
            name="password"
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            required
            autoComplete="new-password"
            className="py-3"
          />

          <PasswordInput
            name="confirmPassword"
            label="Confirmar contraseña"
            placeholder="Confirma tu contraseña"
            required
            autoComplete="new-password"
            className="py-3"
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/30"
          >
            Restablecer contraseña
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
