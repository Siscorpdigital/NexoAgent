import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cambiarContrasena } from "@/app/actions/usuarios";

export default async function CuentaPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; passwordCambiada?: string }>;
}) {
  const { error, passwordCambiada } = await searchParams;

  const session = await auth();
  if (!session) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: { empresa: true },
  });

  if (!usuario) redirect("/login");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>
          Mi Cuenta
        </h1>
        <p className="text-sm mt-1" style={{ color: "#73869A" }}>
          Gestiona tu información y seguridad
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ⚠️ {decodeURIComponent(error)}
        </div>
      )}
      {passwordCambiada && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✅ Contraseña actualizada exitosamente
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del usuario */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
              <div className="text-gray-900">{usuario.nombre}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <div className="text-gray-900">{usuario.email}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Rol</label>
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {usuario.rol}
              </span>
            </div>

            {usuario.empresa && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Empresa</label>
                <div className="text-gray-900">{usuario.empresa.nombre}</div>
              </div>
            )}
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h2>

          <form action={cambiarContrasena} className="space-y-4">
            <input type="hidden" name="usuarioId" value={usuario.id} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña actual *
              </label>
              <input
                type="password"
                name="passwordActual"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña *
              </label>
              <input
                type="password"
                name="passwordNueva"
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nueva contraseña *
              </label>
              <input
                type="password"
                name="passwordConfirmar"
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Actualizar Contraseña
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4">
            💡 Por seguridad, te recomendamos cambiar tu contraseña periódicamente
          </p>
        </div>
      </div>
    </div>
  );
}
