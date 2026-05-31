import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { editarEmpresa } from "@/app/actions/empresas";

export default async function EditarEmpresaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; editado?: string }>;
}) {
  const { id } = await params;
  const { error, editado } = await searchParams;

  const session = await auth();

  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect("/admin");
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: { usuario: true },
  });

  if (!empresa) notFound();

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Empresa</h1>
            <p className="text-gray-600 mt-1">{empresa.nombre}</p>
          </div>
          <a
            href="/admin"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Volver al panel
          </a>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {decodeURIComponent(error)}
          </div>
        )}
        {editado && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ Empresa actualizada exitosamente
          </div>
        )}

        <form action={editarEmpresa} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <input type="hidden" name="empresaId" value={empresa.id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la empresa *
              </label>
              <input
                type="text"
                name="nombre"
                required
                defaultValue={empresa.nombre}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RIF
              </label>
              <input
                type="text"
                name="rif"
                defaultValue={empresa.rif || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIF
              </label>
              <input
                type="text"
                name="nif"
                defaultValue={empresa.nif || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsable
              </label>
              <input
                type="text"
                name="responsable"
                defaultValue={empresa.responsable || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                defaultValue={empresa.direccion || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                name="telefono"
                defaultValue={empresa.telefono || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp *
              </label>
              <input
                type="text"
                name="telefonoWhatsapp"
                required
                defaultValue={empresa.telefonoWhatsapp}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={empresa.email || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Info del usuario */}
          {empresa.usuario && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Usuario asignado</h3>
              <div className="text-sm text-gray-600">
                <p>Nombre: {empresa.usuario.nombre}</p>
                <p>Email: {empresa.usuario.email}</p>
                <p>Rol: {empresa.usuario.rol}</p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Guardar cambios
            </button>
            <a
              href="/admin"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
  );
}
