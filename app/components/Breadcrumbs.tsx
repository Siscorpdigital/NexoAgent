"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  empresaId?: string;
  empresaNombre?: string;
}

/**
 * Componente de breadcrumbs para mostrar la jerarquía de navegación
 *
 * Uso:
 * <Breadcrumbs empresaId={id} empresaNombre={empresa.nombre} />
 *
 * O manualmente:
 * <Breadcrumbs items={[
 *   { label: "Dashboard", href: "/dashboard" },
 *   { label: "Empresas", href: "/dashboard/empresas" },
 *   { label: "Empresa ABC" }
 * ]} />
 */
export default function Breadcrumbs({
  items,
  empresaId,
  empresaNombre,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Si no se pasan items, generarlos automáticamente desde la ruta
  const breadcrumbItems = items || generateBreadcrumbs(pathname, empresaId, empresaNombre);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center flex-wrap gap-1 sm:gap-0 sm:space-x-2 text-xs sm:text-sm mb-4 sm:mb-6" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mx-1 sm:mx-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}

            {isLast || !item.href ? (
              <span className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-none">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[100px] sm:max-w-none"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Genera breadcrumbs automáticamente basándose en la ruta actual
 */
function generateBreadcrumbs(
  pathname: string,
  empresaId?: string,
  empresaNombre?: string
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Mapeo de rutas a etiquetas legibles
  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    empresa: empresaNombre || "Empresa",
    conversaciones: "Conversaciones",
    crm: "CRM",
    conocimiento: "Documentos",
    memoria: "Datos del negocio",
    automatizaciones: "Auto-respuestas",
    agentes: "Asistente",
    agenda: "Agenda",
    analiticas: "Analíticas",
    configuracion: "Configuración",
    cuenta: "Mi Cuenta",
    admin: "Admin",
    usuarios: "Usuarios",
    empresas: "Empresas",
    nueva: "Nueva",
    editar: "Editar",
  };

  // Construir breadcrumbs
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const path = "/" + segments.slice(0, i + 1).join("/");

    // Saltar IDs largos (UUIDs)
    if (segment.length > 20 && segment.includes("-")) {
      continue;
    }

    // Para el segmento de empresa, usar el ID si está disponible
    if (segment === "empresa" && empresaId && i + 1 < segments.length) {
      breadcrumbs.push({
        label: empresaNombre || "Empresa",
        href: `/empresa/${empresaId}`,
      });
      i++; // Saltar el siguiente segmento (ID)
      continue;
    }

    const label = labelMap[segment] || capitalize(segment);

    // No agregar href al último elemento
    const isLast = i === segments.length - 1;

    breadcrumbs.push({
      label,
      href: isLast ? undefined : path,
    });
  }

  // Agregar "Inicio" al principio si estamos en empresa
  if (pathname.startsWith("/empresa/") && empresaId) {
    breadcrumbs.unshift({
      label: "Inicio",
      href: `/empresa/${empresaId}`,
    });
  }

  // Agregar "Dashboard" si estamos en admin
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    breadcrumbs.unshift({
      label: "Dashboard",
      href: "/dashboard",
    });
  }

  return breadcrumbs;
}

/**
 * Capitaliza la primera letra de un string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
