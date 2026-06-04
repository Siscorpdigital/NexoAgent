import { crearTicketPublico } from "@/app/actions/tickets";
import Image from "next/image";
import Link from "next/link";

export default function ContactoPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 relative overflow-hidden px-4 sm:px-6">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 relative z-10 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="NexoAgent"
              width={576}
              height={180}
              priority
              className="w-auto h-20 sm:h-24"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Contacta con Soporte
          </h2>
          <p className="text-gray-600 text-sm">
            ¿Problemas para acceder? Envíanos un mensaje y te ayudaremos
          </p>
        </div>

        {searchParams.success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Mensaje Enviado!
            </h3>
            <p className="text-gray-600 mb-6">
              Hemos recibido tu solicitud. Nuestro equipo te contactará pronto.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium"
            >
              Volver al Login
            </Link>
          </div>
        ) : (
          <>
            {searchParams.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{searchParams.error}</p>
              </div>
            )}

            <form action={crearTicketPublico} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titulo"
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Problemas para iniciar sesión"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descripcion"
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe tu problema en detalle..."
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/30"
                >
                  Enviar Mensaje
                </button>
                <Link
                  href="/login"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </Link>
              </div>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6">
              Si ya tienes cuenta, puedes{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                iniciar sesión aquí
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
