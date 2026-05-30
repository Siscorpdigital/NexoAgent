import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <span className="text-xl font-bold text-gray-900">🤖 NexoAgent</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            📊 Inicio
          </Link>
          <Link
            href="/dashboard/empresas"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            🏢 Empresas
          </Link>
          <Link
            href="/dashboard/conversaciones"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            💬 Conversaciones
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <span className="text-xs text-gray-400">Fase 3 · Local</span>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
