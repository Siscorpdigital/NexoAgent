import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [empresas, conversaciones, mensajes] = await Promise.all([
    prisma.empresa.count(),
    prisma.conversacion.count(),
    prisma.mensaje.count(),
  ]);

  const stats = [
    { label: "Empresas", valor: empresas, icono: "🏢" },
    { label: "Conversaciones", valor: conversaciones, icono: "💬" },
    { label: "Mensajes", valor: mensajes, icono: "📨" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Panel de control</h1>
      <p className="text-sm text-gray-500 mb-8">Resumen general del sistema</p>

      <div className="grid grid-cols-3 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-3">{s.icono}</div>
            <div className="text-3xl font-bold text-gray-900">{s.valor}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
