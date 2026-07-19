import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PlanesAdminView from "@/app/components/PlanesAdminView";

export default async function PlanesPage() {
  const session = await auth();

  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect("/dashboard");
  }

  const planes = await prisma.plan.findMany({
    orderBy: { orden: "asc" },
    include: {
      _count: {
        select: { empresas: true },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold font-sora" style={{ color: "#2D5750" }}>
              Planes y Suscripciones
            </h1>
            <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
              Gestiona los planes comerciales disponibles
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
        </div>
      </div>

      <PlanesAdminView planes={planes} />

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Información sobre Planes
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            • <strong>Valor -1 = Ilimitado</strong>: Para agentes o documentos sin límite
          </p>
          <p>
            • <strong>Nuevas empresas</strong>: Inician en estado TRIAL por 14 días
          </p>
          <p>
            • <strong>Contador mensual</strong>: Se resetea automáticamente cada mes
          </p>
          <p>
            • <strong>Precios</strong>: Expresados en USD, opcionalmente se puede agregar precio en moneda local
          </p>
        </div>
      </div>
    </div>
  );
}
