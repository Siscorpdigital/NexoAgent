import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { agregarNumeroWhatsApp, eliminarNumeroWhatsApp, marcarComoPrincipal, toggleActivoWhatsApp } from "@/app/actions/whatsapp";
import { checkPlanLimit } from "@/lib/plan-limits";

export default async function WhatsAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id: empresaId } = await params;
  const { success, error } = await searchParams;

  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.rol === "CLIENTE" && session.user.empresaId !== empresaId) {
    redirect(`/empresa/${session.user.empresaId}/whatsapp`);
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: {
      plan: true,
      numerosWhatsApp: {
        orderBy: [
          { esPrincipal: "desc" },
          { creadoEn: "asc" },
        ],
      },
    },
  });

  if (!empresa) redirect("/dashboard");

  const limitCheck = await checkPlanLimit(empresaId, "whatsapps");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>Números de WhatsApp</h1>
        <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
          Vincula el número por el que atenderá tu asistente
        </p>
      </div>

      {success && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(43,170,138,0.08)", border: "1px solid rgba(43,170,138,0.25)", color: "#2BAA8A" }}>
          ✓ {decodeURIComponent(success)}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {decodeURIComponent(error)}
        </div>
      )}

      {/* Plan info */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(43,170,138,0.06)", border: "1px solid rgba(43,170,138,0.22)" }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold font-sora" style={{ color: "#2D5750" }}>{empresa.plan?.nombre || "Sin plan"}</h3>
            <p className="text-sm mt-1" style={{ color: "#5C7872" }}>{limitCheck.message}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>
              {limitCheck.current} / {limitCheck.max === -1 ? "∞" : limitCheck.max}
            </p>
            <p className="text-xs" style={{ color: "#5C7872" }}>números activos</p>
          </div>
        </div>
      </div>

      {/* Add button */}
      {limitCheck.allowed && (
        <form action={agregarNumeroWhatsApp} className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <input type="hidden" name="empresaId" value={empresaId} />
          <h2 className="text-lg font-semibold font-sora mb-4" style={{ color: "#2D5750" }}>Agregar nuevo número</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de teléfono *
              </label>
              <input
                type="text"
                name="telefono"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+584241234567"
              />
              <p className="text-xs text-gray-500 mt-1">Formato internacional</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre/Alias
              </label>
              <input
                type="text"
                name="nombre"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Soporte, Ventas"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="px-6 py-2 text-white rounded-lg transition-opacity hover:opacity-90 font-medium grad-bg"
            >
              + Agregar número
            </button>
          </div>
        </form>
      )}

      {!limitCheck.allowed && (
        <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800">
            ⚠️ Has alcanzado el límite de tu plan. Contacta al administrador para actualizar.
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {empresa.numerosWhatsApp.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-500">No hay números de WhatsApp registrados</p>
          </div>
        ) : (
          empresa.numerosWhatsApp.map((numero) => (
            <div
              key={numero.id}
              className="bg-white rounded-xl border shadow-sm p-5"
              style={{
                borderColor: numero.esPrincipal ? "rgba(43,170,138,0.35)" : "#C8DAD6",
                background: numero.esPrincipal ? "rgba(43,170,138,0.05)" : "#fff",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold font-sora" style={{ color: "#2D5750" }}>{numero.telefono}</h3>
                    {numero.esPrincipal && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded" style={{ background: "rgba(43,170,138,0.12)", color: "#2BAA8A" }}>
                        Principal
                      </span>
                    )}
                    {!numero.activo && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {numero.nombre && (
                    <p className="text-sm text-gray-600">{numero.nombre}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Creado: {new Date(numero.creadoEn).toLocaleDateString("es-VE")}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {!numero.esPrincipal && (
                    <form action={marcarComoPrincipal}>
                      <input type="hidden" name="empresaId" value={empresaId} />
                      <input type="hidden" name="numeroId" value={numero.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs rounded-lg transition-opacity hover:opacity-80 font-medium"
                        style={{ background: "rgba(43,170,138,0.12)", color: "#2BAA8A" }}
                      >
                        Marcar principal
                      </button>
                    </form>
                  )}

                  <form action={toggleActivoWhatsApp}>
                    <input type="hidden" name="empresaId" value={empresaId} />
                    <input type="hidden" name="numeroId" value={numero.id} />
                    <button
                      type="submit"
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        numero.activo
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {numero.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>

                  {!numero.esPrincipal && (
                    <form action={eliminarNumeroWhatsApp}>
                      <input type="hidden" name="empresaId" value={empresaId} />
                      <input type="hidden" name="numeroId" value={numero.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                        onClick={(e) => {
                          if (!confirm("¿Seguro que deseas eliminar este número?")) {
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
