import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Gestiona todas las empresas y usuarios</p>
          </div>
          <Link
            href="/admin/empresas/nueva"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Nueva Empresa
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { label: "Empresas", valor: empresas.length, color: "blue" },
            { label: "Con usuario", valor: empresas.filter((e) => e.usuario).length, color: "green" },
            { label: "Conversaciones", valor: empresas.reduce((acc, e) => acc + e._count.conversaciones, 0), color: "purple" },
            { label: "Contactos", valor: empresas.reduce((acc, e) => acc + e._count.contactos, 0), color: "indigo" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stat.valor}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Lista de empresas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Empresas registradas</h2>
          </div>

          {empresas.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">
              No hay empresas todavía. <Link href="/admin/empresas/nueva" className="text-blue-600">Crea la primera</Link>.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{empresa.nombre[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{empresa.nombre}</div>
                          {empresa.rif && <div className="text-sm text-gray-500">{empresa.rif}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{empresa.responsable || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{empresa.email || "-"}</div>
                      <div className="text-sm text-gray-500">{empresa.telefonoWhatsapp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {empresa.usuario ? (
                        <div>
                          <div className="text-sm text-gray-900">{empresa.usuario.nombre}</div>
                          <div className="text-xs text-gray-500">{empresa.usuario.email}</div>
                        </div>
                      ) : (
                        <Link
                          href={`/admin/empresas/${empresa.id}/usuario`}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          + Crear usuario
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{empresa._count.conversaciones} conv</div>
                      <div>{empresa._count.contactos} contactos</div>
                      <div>{empresa._count.citas} citas</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <Link
                        href={`/empresa/${empresa.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/empresas/${empresa.id}/editar`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
  );
}
