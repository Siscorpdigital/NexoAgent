/**
 * Utilidades para exportar datos a CSV y JSON
 */

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  // Obtener headers de las claves del primer objeto
  const headers = Object.keys(data[0]);

  // Crear filas CSV
  const csvContent = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escapar valores con comas o comillas
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",")
    ),
  ].join("\n");

  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Preparar contactos para exportación
 */
export function prepareContactosForExport(contactos: any[]) {
  return contactos.map((c) => ({
    Nombre: c.nombre || "Sin nombre",
    Teléfono: c.telefono,
    Tipo: c.tipo,
    Conversaciones: c._count?.conversaciones || 0,
    "Creado en": new Date(c.creadoEn).toLocaleDateString("es-MX"),
    Notas: c.notas || "",
  }));
}

/**
 * Preparar conversaciones para exportación
 */
export function prepareConversacionesForExport(conversaciones: any[]) {
  return conversaciones.map((c) => ({
    "Número Cliente": c.numeroCliente,
    Empresa: c.empresa?.nombre || "",
    Mensajes: c._count?.mensajes || 0,
    "Modo Humano": c.modoHumano ? "Sí" : "No",
    Estado: c.estado,
    "Última actualización": new Date(c.actualizadoEn).toLocaleDateString("es-MX"),
  }));
}

/**
 * Preparar analíticas para exportación
 */
export function prepareAnaliticasForExport(data: {
  totalConversaciones: number;
  totalMensajesIA: number;
  totalMensajesHumano: number;
  totalContactos: number;
  tasaIA: number;
}) {
  return [
    { Métrica: "Total de Conversaciones", Valor: data.totalConversaciones },
    { Métrica: "Mensajes atendidos por IA", Valor: data.totalMensajesIA },
    { Métrica: "Mensajes de clientes", Valor: data.totalMensajesHumano },
    { Métrica: "Total de Contactos", Valor: data.totalContactos },
    { Métrica: "Tasa de atención IA (%)", Valor: data.tasaIA },
  ];
}
