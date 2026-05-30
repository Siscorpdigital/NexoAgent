import { prisma } from "@/lib/prisma";
import { crearEmpresa, actualizarPrompt } from "@/app/actions/empresas";

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const empresas = await prisma.empresa.findMany({
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Empresas</h1>
      <p className="text-sm text-gray-500 mb-8">
        Configura cada empresa y las instrucciones de su asistente
      </p>

      {guardado && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          ✅ Instrucciones guardadas correctamente.
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mb-10">
        {/* Formulario nueva empresa */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Nueva empresa</h2>
          <form action={crearEmpresa} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre</label>
              <input
                name="nombre"
                type="text"
                required
                placeholder="Ej: Ferretería López"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Teléfono WhatsApp
              </label>
              <input
                name="telefono"
                type="text"
                required
                placeholder="Ej: +14155238886"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Crear empresa
            </button>
          </form>
        </div>

        {/* Lista de empresas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Registradas ({empresas.length})
          </h2>
          {empresas.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no hay empresas.</p>
          ) : (
            <ul className="space-y-3">
              {empresas.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 border border-gray-100 rounded-lg p-3"
                >
                  <span className="text-2xl">🏢</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{e.nombre}</p>
                    <p className="text-xs text-gray-400">{e.telefonoWhatsapp}</p>
                  </div>
                  <a
                    href={`/empresa/${e.id}`}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1 rounded-full transition-colors"
                  >
                    Ver panel →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Configurar asistente por empresa */}
      {empresas.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Instrucciones del asistente
          </h2>
          <div className="space-y-5">
            {empresas.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏢</span>
                  <span className="font-semibold text-gray-800">{e.nombre}</span>
                </div>
                <form action={actualizarPrompt} className="space-y-3">
                  <input type="hidden" name="id" value={e.id} />
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Instrucciones para la IA
                    </label>
                    <textarea
                      name="prompt"
                      rows={5}
                      defaultValue={e.promptSistema ?? ""}
                      placeholder={`Ej: Eres el asistente de ${e.nombre}. Atendemos de lunes a viernes de 9am a 6pm. Si el cliente quiere cotizar, pídele el producto y la cantidad.`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors"
                  >
                    Guardar instrucciones
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
