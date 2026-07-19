import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/app/components/help/EmptyState";
import ScrollToTop from "@/app/components/ScrollToTop";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await auth();
  const { success, error } = await searchParams;

  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect("/dashboard");
  }

  const empresas = await prisma.empresa.findMany({
    include: {
      usuario: true,
      plan: true,
      _count: {
        select: {
          conversaciones: true,
          contactos: true,
          citas: true,
        },
      },
    },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {success && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ {decodeURIComponent(success)}
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {decodeURIComponent(error)}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>
              Panel de Administración
            </h1>
            <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
              Gestiona todas las empresas y usuarios
            </p>
          </div>
          <Link
            href="/admin/empresas/nueva"
            className="w-full sm:w-auto text-center px-5 py-2.5 text-white rounded-lg transition-opacity hover:opacity-90 font-medium text-sm grad-bg"
          >
            + Nueva Empresa
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Empresas", valor: empresas.length, color: "#2D5750" },
            { label: "Con usuario", valor: empresas.filter((e) => e.usuario).length, color: "#2BAA8A" },
            { label: "Conversaciones", valor: empresas.reduce((acc, e) => acc + e._count.conversaciones, 0), color: "#2BAA8A" },
            { label: "Contactos", valor: empresas.reduce((acc, e) => acc + e._count.contactos, 0), color: "#F2A020" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5" style={{ border: "1px solid #C8DAD6" }}>
              <p className="text-3xl font-bold font-sora" style={{ color: stat.color }}>{stat.valor}</p>
              <p className="text-sm mt-1" style={{ color: "#5C7872" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Lista de empresas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: "1px solid #C8DAD6" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #F4F7F6" }}>
            <h2 className="font-semibold font-sora text-sm" style={{ color: "#2D5750" }}>
              Empresas registradas · {empresas.length}
            </h2>
          </div>

          {/* Wrapper con scroll horizontal solo en la tabla */}
          <div className="overflow-x-auto">

          {empresas.length === 0 ? (
            <div className="px-6 py-10">
              <EmptyState
                icon="🏢"
                title="No hay empresas todavía"
                description="Crea la primera empresa para comenzar"
              />
            </div>
          ) : (
            <>
              {/* Vista de tabla para desktop */}
              <table className="w-full hidden md:table">
                <thead style={{ background: "#FAFCFE" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#5C7872" }}>
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#5C7872" }}>
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#5C7872" }}>
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#5C7872" }}>
                      Stats
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#5C7872" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y" style={{ borderColor: "#F4F7F6" }}>
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold font-sora text-sm flex-shrink-0"
                          style={{ background: "rgba(43,130,240,0.08)", color: "#2D5750" }}
                        >
                          {empresa.nombre[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm font-sora truncate" style={{ color: "#2D5750" }}>
                            {empresa.nombre}
                          </div>
                          {empresa.responsable && (
                            <div className="text-xs truncate" style={{ color: "#5C7872" }}>
                              {empresa.responsable}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs" style={{ color: "#2D5750" }}>
                        {empresa.email || empresa.telefonoWhatsapp}
                      </div>
                      {empresa.usuario && (
                        <div className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                          👤 {empresa.usuario.nombre}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {empresa.plan ? (
                        <div>
                          <div className="text-xs font-medium" style={{ color: "#2D5750" }}>
                            {empresa.plan.nombre}
                          </div>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            empresa.estadoPlan === "ACTIVO" ? "bg-green-100 text-green-700" :
                            empresa.estadoPlan === "TRIAL" ? "bg-blue-100 text-blue-700" :
                            empresa.estadoPlan === "SUSPENDIDO" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {empresa.estadoPlan}
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={`/admin/empresas/${empresa.id}/plan`}
                          className="text-xs hover:underline"
                          style={{ color: "#2D5750" }}
                        >
                          + Plan
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#5C7872" }}>
                      <div>{empresa._count.conversaciones} conv</div>
                      <div>{empresa._count.contactos} cont</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/empresa/${empresa.id}`}
                          className="hover:underline"
                          style={{ color: "#2D5750" }}
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/admin/empresas/${empresa.id}/editar`}
                          className="hover:underline"
                          style={{ color: "#5C7872" }}
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Vista de cards para móvil */}
            <div className="md:hidden divide-y" style={{ borderColor: "#F4F7F6" }}>
              {empresas.map((empresa) => (
                <div key={empresa.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold font-sora flex-shrink-0"
                      style={{ background: "rgba(43,130,240,0.08)", color: "#2D5750" }}
                    >
                      {empresa.nombre[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm font-sora" style={{ color: "#2D5750" }}>
                        {empresa.nombre}
                      </div>
                      {empresa.rif && (
                        <div className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                          {empresa.rif}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div>
                      <span className="text-xs font-medium" style={{ color: "#5C7872" }}>Responsable: </span>
                      <span style={{ color: "#2D5750" }}>{empresa.responsable || "-"}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: "#5C7872" }}>Plan: </span>
                      {empresa.plan ? (
                        <>
                          <span style={{ color: "#2D5750" }}>{empresa.plan.nombre}</span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                            empresa.estadoPlan === "ACTIVO" ? "bg-green-100 text-green-700" :
                            empresa.estadoPlan === "TRIAL" ? "bg-blue-100 text-blue-700" :
                            empresa.estadoPlan === "SUSPENDIDO" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {empresa.estadoPlan}
                          </span>
                        </>
                      ) : (
                        <Link
                          href={`/admin/empresas/${empresa.id}/plan`}
                          className="text-xs hover:underline"
                          style={{ color: "#2D5750" }}
                        >
                          + Asignar plan
                        </Link>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: "#5C7872" }}>Contacto: </span>
                      <span style={{ color: "#2D5750" }}>{empresa.email || "-"}</span>
                      {empresa.telefonoWhatsapp && (
                        <div className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                          {empresa.telefonoWhatsapp}
                        </div>
                      )}
                    </div>
                    {empresa.usuario ? (
                      <div>
                        <span className="text-xs font-medium" style={{ color: "#5C7872" }}>Usuario: </span>
                        <span style={{ color: "#2D5750" }}>{empresa.usuario.nombre}</span>
                        <div className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                          {empresa.usuario.email}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/admin/empresas/${empresa.id}/usuario`}
                        className="text-xs hover:underline inline-block"
                        style={{ color: "#2D5750" }}
                      >
                        + Crear usuario
                      </Link>
                    )}
                    <div className="text-xs" style={{ color: "#5C7872" }}>
                      <div>{empresa._count.conversaciones} conv · {empresa._count.contactos} contactos · {empresa._count.citas} citas</div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-sm font-medium">
                    <Link
                      href={`/empresa/${empresa.id}`}
                      className="flex-1 text-center px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      style={{ color: "#2D5750", border: "1px solid #2D5750" }}
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/empresas/${empresa.id}/editar`}
                      className="flex-1 text-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ color: "#5C7872", border: "1px solid #C8DAD6" }}
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
          </div>
        </div>

      <ScrollToTop />
    </div>
  );
}
