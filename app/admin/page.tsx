import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/app/components/help/EmptyState";
import ScrollToTop from "@/app/components/ScrollToTop";

export default async function AdminPage() {
  const session = await auth();

  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect("/dashboard");
  }

  const empresas = await prisma.empresa.findMany({
    include: {
      usuario: true,
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>
              Panel de Administración
            </h1>
            <p className="text-sm mt-1" style={{ color: "#73869A" }}>
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
            { label: "Empresas", valor: empresas.length, color: "#2B82F0" },
            { label: "Con usuario", valor: empresas.filter((e) => e.usuario).length, color: "#22B26B" },
            { label: "Conversaciones", valor: empresas.reduce((acc, e) => acc + e._count.conversaciones, 0), color: "#15B8C9" },
            { label: "Contactos", valor: empresas.reduce((acc, e) => acc + e._count.contactos, 0), color: "#FB923C" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5" style={{ border: "1px solid #E2E9F0" }}>
              <p className="text-3xl font-bold font-sora" style={{ color: stat.color }}>{stat.valor}</p>
              <p className="text-sm mt-1" style={{ color: "#73869A" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Lista de empresas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: "1px solid #E2E9F0" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #F4F7FA" }}>
            <h2 className="font-semibold font-sora text-sm" style={{ color: "#0E2436" }}>
              Empresas registradas · {empresas.length}
            </h2>
          </div>

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
              <table className="min-w-full hidden md:table">
                <thead style={{ background: "#FAFCFE" }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#73869A" }}>
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#73869A" }}>
                      Responsable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#73869A" }}>
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#73869A" }}>
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#73869A" }}>
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#73869A" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y" style={{ borderColor: "#F4F7FA" }}>
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold font-sora"
                          style={{ background: "rgba(43,130,240,0.08)", color: "#2B82F0" }}
                        >
                          {empresa.nombre[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm font-sora" style={{ color: "#0E2436" }}>
                            {empresa.nombre}
                          </div>
                          {empresa.rif && (
                            <div className="text-xs mt-0.5" style={{ color: "#73869A" }}>
                              {empresa.rif}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: "#0E2436" }}>
                        {empresa.responsable || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: "#0E2436" }}>
                        {empresa.email || "-"}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#73869A" }}>
                        {empresa.telefonoWhatsapp}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {empresa.usuario ? (
                        <div>
                          <div className="text-sm" style={{ color: "#0E2436" }}>
                            {empresa.usuario.nombre}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "#73869A" }}>
                            {empresa.usuario.email}
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={`/admin/empresas/${empresa.id}/usuario`}
                          className="text-xs hover:underline"
                          style={{ color: "#2B82F0" }}
                        >
                          + Crear usuario
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: "#73869A" }}>
                      <div>{empresa._count.conversaciones} conv</div>
                      <div>{empresa._count.contactos} contactos</div>
                      <div>{empresa._count.citas} citas</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <Link
                        href={`/empresa/${empresa.id}`}
                        className="hover:underline"
                        style={{ color: "#2B82F0" }}
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/empresas/${empresa.id}/editar`}
                        className="hover:underline"
                        style={{ color: "#73869A" }}
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Vista de cards para móvil */}
            <div className="md:hidden divide-y" style={{ borderColor: "#F4F7FA" }}>
              {empresas.map((empresa) => (
                <div key={empresa.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold font-sora flex-shrink-0"
                      style={{ background: "rgba(43,130,240,0.08)", color: "#2B82F0" }}
                    >
                      {empresa.nombre[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm font-sora" style={{ color: "#0E2436" }}>
                        {empresa.nombre}
                      </div>
                      {empresa.rif && (
                        <div className="text-xs mt-0.5" style={{ color: "#73869A" }}>
                          {empresa.rif}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div>
                      <span className="text-xs font-medium" style={{ color: "#73869A" }}>Responsable: </span>
                      <span style={{ color: "#0E2436" }}>{empresa.responsable || "-"}</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: "#73869A" }}>Contacto: </span>
                      <span style={{ color: "#0E2436" }}>{empresa.email || "-"}</span>
                      {empresa.telefonoWhatsapp && (
                        <div className="text-xs mt-0.5" style={{ color: "#73869A" }}>
                          {empresa.telefonoWhatsapp}
                        </div>
                      )}
                    </div>
                    {empresa.usuario ? (
                      <div>
                        <span className="text-xs font-medium" style={{ color: "#73869A" }}>Usuario: </span>
                        <span style={{ color: "#0E2436" }}>{empresa.usuario.nombre}</span>
                        <div className="text-xs mt-0.5" style={{ color: "#73869A" }}>
                          {empresa.usuario.email}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/admin/empresas/${empresa.id}/usuario`}
                        className="text-xs hover:underline inline-block"
                        style={{ color: "#2B82F0" }}
                      >
                        + Crear usuario
                      </Link>
                    )}
                    <div className="text-xs" style={{ color: "#73869A" }}>
                      <div>{empresa._count.conversaciones} conv · {empresa._count.contactos} contactos · {empresa._count.citas} citas</div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-sm font-medium">
                    <Link
                      href={`/empresa/${empresa.id}`}
                      className="flex-1 text-center px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      style={{ color: "#2B82F0", border: "1px solid #2B82F0" }}
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/empresas/${empresa.id}/editar`}
                      className="flex-1 text-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ color: "#73869A", border: "1px solid #E2E9F0" }}
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

      <ScrollToTop />
    </div>
  );
}
