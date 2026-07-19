import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { actualizarPrompt, editarEmpresa } from "@/app/actions/empresas";
import DocumentosPanel from "./DocumentosPanel";
import EliminarEmpresa from "./EliminarEmpresa";

export default async function EmpresaConfiguracionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string; editado?: string }>;
}) {
  const { id } = await params;
  const { guardado, editado } = await searchParams;

  // Solo PROVEEDOR puede acceder
  const session = await auth();
  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect(`/empresa/${id}`);
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: { documentos: { orderBy: { creadoEn: "desc" } } },
  });
  if (!empresa) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>Configuración</h1>
        <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
          Gestiona los datos y el asistente de {empresa.nombre}
        </p>
      </div>

      {(guardado || editado) && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ background: "rgba(43, 170, 138,0.08)", border: "1px solid rgba(43, 170, 138,0.25)", color: "#2BAA8A" }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {editado ? "Datos de la empresa actualizados." : "Instrucciones guardadas correctamente."}
        </div>
      )}

      {/* Editar datos de la empresa */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #C8DAD6" }}>
        <h2 className="font-semibold font-sora mb-1" style={{ color: "#2D5750" }}>Datos de la empresa</h2>
        <p className="text-xs mb-5" style={{ color: "#5C7872" }}>Nombre y número de WhatsApp asociado al asistente</p>
        <form action={editarEmpresa} className="space-y-4">
          <input type="hidden" name="id" value={empresa.id} />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D6E65" }}>Nombre de la empresa</label>
            <input
              name="nombre"
              type="text"
              required
              defaultValue={empresa.nombre}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D6E65" }}>Número de WhatsApp</label>
            <input
              name="telefono"
              type="text"
              required
              defaultValue={empresa.telefonoWhatsapp}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
            />
          </div>
          <button
            type="submit"
            className="text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-opacity hover:opacity-90 grad-bg"
          >
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Instrucciones del asistente */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #C8DAD6" }}>
        <h2 className="font-semibold font-sora mb-1" style={{ color: "#2D5750" }}>Instrucciones del asistente</h2>
        <p className="text-xs mb-5" style={{ color: "#5C7872" }}>
          Define el tono, la personalidad y las reglas de comportamiento de la IA
        </p>
        <form action={actualizarPrompt} className="space-y-4">
          <input type="hidden" name="id" value={empresa.id} />
          <input type="hidden" name="origen" value="empresa" />
          <textarea
            name="prompt"
            rows={6}
            defaultValue={empresa.promptSistema ?? ""}
            placeholder={`Ej: Eres el asistente de ${empresa.nombre}. Eres amable y profesional. Atendemos de lunes a viernes de 9am a 6pm. Si el cliente quiere cotizar, pídele su nombre y teléfono.`}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
          />
          <button
            type="submit"
            className="text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-opacity hover:opacity-90 grad-bg"
          >
            Guardar instrucciones
          </button>
        </form>
      </div>

      {/* Base de conocimiento */}
      <DocumentosPanel empresaId={empresa.id} documentosIniciales={empresa.documentos} />

      {/* Zona de peligro */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #FECACA" }}>
        <h2 className="font-semibold font-sora mb-1" style={{ color: "#DC2626" }}>Zona de peligro</h2>
        <p className="text-xs mb-5" style={{ color: "#5C7872" }}>
          Eliminar esta empresa borrará todas sus conversaciones, mensajes y documentos. Esta acción no se puede deshacer.
        </p>
        <EliminarEmpresa id={empresa.id} nombre={empresa.nombre} />
      </div>
    </div>
  );
}
