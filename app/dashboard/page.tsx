import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Single-tenant (Previsión Familiar): entrar directo al ambiente del agente
  // de la única empresa, en vez del panel multi-empresa del modelo SaaS.
  if (session.user.empresaId) {
    redirect(`/empresa/${session.user.empresaId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Preparando tu ambiente…
        </h1>
        <p className="text-gray-600">
          Si esto persiste, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}
