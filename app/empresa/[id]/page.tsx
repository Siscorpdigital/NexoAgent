import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EmpresaHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: { _count: { select: { conversaciones: true } } },
  });
  if (!empresa) notFound();

  const [conversaciones, mensajes, pendientes] = await Promise.all([
    prisma.conversacion.count({ where: { empresaId: id } }),
    prisma.mensaje.count({
      where: { conversacion: { empresaId: id } },
    }),
    prisma.conversacion.count({
      where: { empresaId: id, modoHumano: true },
    }),
  ]);

  const stats = [
    { label: "Conversaciones", valor: conversaciones, icono: "💬" },
    { label: "Mensajes", valor: mensajes, icono: "📨" },
    { label: "Esperan atención humana", valor: pendientes, icono: "⚠️" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{empresa.nombre}</h1>
      <p className="text-sm text-gray-500 mb-8">{empresa.telefonoWhatsapp}</p>

      <div className="grid grid-cols-3 gap-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl border p-6 ${
              s.label === "Esperan atención humana" && s.valor > 0
                ? "border-orange-300 bg-orange-50"
                : "border-gray-200"
            }`}
          >
            <div className="text-3xl mb-3">{s.icono}</div>
            <div className="text-3xl font-bold text-gray-900">{s.valor}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
