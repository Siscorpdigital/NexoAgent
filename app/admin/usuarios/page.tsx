import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { crearUsuarioProveedor, cambiarContrasena, eliminarUsuario } from "@/app/actions/usuarios";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; creado?: string; actualizada?: string; eliminado?: string }>;
}) {
  const session = await auth();

  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect("/admin");
  }

  const { error, creado, actualizada, eliminado } = await searchParams;

  const usuarios = await prisma.usuario.findMany({
    include: {
      empresa: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: { creadoEn: "desc" },
  });

  const proveedores = usuarios.filter((u) => u.rol === "PROVEEDOR");
  const clientes = usuarios.filter((u) => u.rol === "CLIENTE");

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Administra usuarios del sistema</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            ← Volver al panel
          </Link>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {decodeURIComponent(error)}
          </div>
        )}
        {creado && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ Usuario administrador creado exitosamente
          </div>
        )}
        {actualizada && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ Contraseña actualizada exitosamente
          </div>
        )}
        {eliminado && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ Usuario eliminado exitosamente
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Crear nuevo administrador */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Administrador</h2>
            <form action={crearUsuarioProveedor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: María González"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="maria@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Crear Administrador
              </button>
            </form>
          </div>

          {/* Cambiar mi contraseña */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Mi Contraseña</h2>
            <form action={cambiarContrasena} className="space-y-4">
              <input type="hidden" name="usuarioId" value={session.user.id} />

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
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Actualizar Contraseña
              </button>
            </form>
          </div>
        </div>

        {/* Lista de administradores */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Administradores ({proveedores.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {proveedores.map((usuario) => (
              <div key={usuario.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{usuario.nombre}</div>
                  <div className="text-sm text-gray-500">{usuario.email}</div>
                  {usuario.id === session.user.id && (
                    <span className="text-xs text-blue-600 font-medium">Tú</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {usuario.id !== session.user.id && (
                    <form action={eliminarUsuario.bind(null, usuario.id)}>
                      <button
                        type="submit"
                        className="text-sm text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          if (!confirm(`¿Eliminar a ${usuario.nombre}?`)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Usuarios Clientes ({clientes.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {clientes.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400">
                No hay usuarios clientes todavía
              </div>
            ) : (
              clientes.map((usuario) => (
                <div key={usuario.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{usuario.nombre}</div>
                    <div className="text-sm text-gray-500">{usuario.email}</div>
                    {usuario.empresa && (
                      <div className="text-xs text-gray-400 mt-1">
                        Empresa: {usuario.empresa.nombre}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/empresa/${usuario.empresaId}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Ver empresa →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
}
