import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EmpresaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) notFound();

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <p className="text-xs text-gray-400 mb-1">Panel de</p>
          <span className="text-base font-bold text-gray-900 leading-tight">
            {empresa.nombre}
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href={`/empresa/${id}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            📊 Inicio
          </Link>
          <Link
            href={`/empresa/${id}/conversaciones`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            💬 Conversaciones
          </Link>
          <Link
            href={`/empresa/${id}/configuracion`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            ⚙️ Configuración
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">
            ← Admin general
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
