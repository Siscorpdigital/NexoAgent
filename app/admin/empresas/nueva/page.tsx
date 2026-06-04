import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { crearEmpresaConUsuario } from "@/app/actions/admin";
import PasswordInput from "@/app/components/PasswordInput";

export default async function NuevaEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();

  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  // Obtener planes disponibles
  const planes = await prisma.plan.findMany({
    where: { visible: true },
    orderBy: { orden: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nueva Empresa</h1>
          <p className="text-gray-600 mt-1">Crea una nueva empresa y opcionalmente su usuario de acceso</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {decodeURIComponent(error)}
          </div>
        )}

        <form action={crearEmpresaConUsuario} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Datos de la empresa */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de la empresa</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la empresa *
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Clínica Dental Sonrisas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RIF
                </label>
                <input
                  type="text"
                  name="rif"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: J-123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIF
                </label>
                <input
                  type="text"
                  name="nif"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 12345678A"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsable
                </label>
                <input
                  type="text"
                  name="responsable"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Dr. Juan Pérez"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Calle Principal #123, Caracas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: +58 424 1234567"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: +584241234567"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: contacto@clinica.com"
                />
              </div>

              {/* Selector de Plan */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan de suscripción *
                </label>
                <select
                  name="planId"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona un plan...</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - ${plan.precio} USD/mes ({plan.maxWhatsApps} WhatsApp{plan.maxWhatsApps > 1 ? 's' : ''}, {plan.maxAgentes === -1 ? 'Agentes ilimitados' : `${plan.maxAgentes} agentes`})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  La empresa iniciará con un período de prueba de 14 días
                </p>
              </div>
            </div>
          </div>

          {/* Datos del usuario (opcional) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Usuario de acceso (opcional)</h2>
            <p className="text-sm text-gray-600 mb-4">Si deseas crear un usuario CLIENTE para esta empresa, completa estos campos</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="usuarioNombre"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de acceso
                </label>
                <input
                  type="email"
                  name="usuarioEmail"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: juan@clinica.com"
                />
              </div>

              <div>
                <PasswordInput
                  name="usuarioPassword"
                  label="Contraseña"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              ℹ️ Puedes crear el usuario más tarde desde el panel de administración
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Crear empresa
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
