import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reactivarIA } from "@/app/actions/conversaciones";
import ChatMessages from "@/app/components/ChatMessages";
import LoadingButton from "@/app/components/ui/LoadingButton";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export default async function ConversacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversacion = await prisma.conversacion.findUnique({
    where: { id },
    include: {
      empresa: { select: { nombre: true } },
      mensajes: { orderBy: { creadoEn: "asc" } },
    },
  });

  if (!conversacion) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conversaciones", href: "/dashboard/conversaciones" },
          { label: conversacion.numeroCliente },
        ]}
      />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>
            {conversacion.numeroCliente}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
            {conversacion.empresa.nombre} · {conversacion.mensajes.length} mensajes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {conversacion.modoHumano && (
            <form action={reactivarIA}>
              <input type="hidden" name="id" value={conversacion.id} />
              <LoadingButton
                type="submit"
                className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                style={{ background: "rgba(242, 160, 32,0.1)", color: "#F2A020" }}
              >
                ⚠️ Reactivar IA
              </LoadingButton>
            </form>
          )}
          <span
            className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
              conversacion.estado === "ACTIVA"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {conversacion.estado}
          </span>
        </div>
      </div>

      <div
        className="bg-white rounded-xl p-6 space-y-4 min-h-96 max-h-[600px] overflow-y-auto"
        style={{ border: "1px solid #C8DAD6" }}
      >
        <ChatMessages mensajes={conversacion.mensajes} autoRefresh={true} />
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/dashboard/conversaciones"
          className="text-sm font-medium transition-colors hover:underline"
          style={{ color: "#2D5750" }}
        >
          ← Volver a conversaciones
        </Link>
      </div>
    </div>
  );
}
