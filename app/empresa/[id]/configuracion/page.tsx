import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { actualizarPrompt } from "@/app/actions/empresas";
import DocumentosPanel from "./DocumentosPanel";

export default async function EmpresaConfiguracionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { id } = await params;
  const { guardado } = await searchParams;

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: { documentos: { orderBy: { creadoEn: "desc" } } },
  });
  if (!empresa) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Configuración</h1>
        <p className="text-sm text-gray-500">
          Personaliza cómo responde el asistente de {empresa.nombre}
        </p>
      </div>

      {guardado && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          ✅ Instrucciones guardadas correctamente.
        </div>
      )}

      {/* Instrucciones del asistente */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">
          Instrucciones del asistente
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Define el tono, la personalidad y las reglas de comportamiento de la IA.
        </p>
        <form action={actualizarPrompt} className="space-y-4">
          <input type="hidden" name="id" value={empresa.id} />
          <input type="hidden" name="origen" value="empresa" />
          <textarea
            name="prompt"
            rows={6}
            defaultValue={empresa.promptSistema ?? ""}
            placeholder={`Ej: Eres el asistente de ${empresa.nombre}. Eres amable y profesional. Atendemos de lunes a viernes de 9am a 6pm. Si el cliente quiere cotizar, pídele su nombre y teléfono.`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Guardar instrucciones
          </button>
        </form>
      </div>

      {/* Base de conocimiento */}
      <DocumentosPanel
        empresaId={empresa.id}
        documentosIniciales={empresa.documentos}
      />

      {/* Info del número */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-3">Datos del número</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="text-gray-400">Empresa:</span> {empresa.nombre}</p>
          <p><span className="text-gray-400">WhatsApp:</span> {empresa.telefonoWhatsapp}</p>
        </div>
      </div>
    </div>
  );
}
