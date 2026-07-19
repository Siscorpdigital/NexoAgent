"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export interface Filter {
  id: string;
  label: string;
  value: string;
  count?: number;
  icon?: ReactNode;
  color?: string;
}

interface FilterBarProps {
  filters: Filter[];
  activeFilter: string;
  onChange: (filterId: string) => void;
  className?: string;
}

/**
 * Barra de filtros con tabs y contadores visuales (con state local)
 *
 * Uso:
 * <FilterBar
 *   filters={[
 *     { id: "all", label: "Todos", value: "all", count: 50 },
 *     { id: "lead", label: "Leads", value: "LEAD", count: 25, color: "#2D5750" },
 *   ]}
 *   activeFilter={activeFilter}
 *   onChange={setActiveFilter}
 * />
 */
export default function FilterBar({
  filters,
  activeFilter,
  onChange,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide",
        className
      )}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const hasColor = filter.color;

        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-sm",
              isActive ? "text-white shadow-sm" : "bg-white hover:bg-gray-50"
            )}
            style={
              isActive && hasColor
                ? { background: filter.color }
                : isActive
                ? { background: "#2D5750" }
                : { border: "1px solid #C8DAD6", color: "#3D6E65" }
            }
          >
            {filter.icon && (
              <span className="text-base">
                {filter.icon}
              </span>
            )}
            <span>{filter.label}</span>
            {filter.count !== undefined && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold transition-all",
                  isActive ? "bg-white/20" : "bg-gray-100"
                )}
                style={
                  isActive
                    ? { color: "white" }
                    : { color: filter.color || "#5C7872" }
                }
              >
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * FilterBar con navegación por URL
 *
 * Uso:
 * <FilterBarWithUrl
 *   filters={[...]}
 *   baseUrl="/empresa/123/crm"
 *   queryParam="tipo"
 * />
 */
export function FilterBarWithUrl({
  filters,
  baseUrl,
  queryParam = "filter",
  className,
}: {
  filters: Filter[];
  baseUrl: string;
  queryParam?: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get(queryParam) || filters[0]?.id;

  const buildUrl = (filterKey: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (filterKey === filters[0]?.id) {
      params.delete(queryParam);
    } else {
      params.set(queryParam, filterKey);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const hasColor = filter.color;

        return (
          <Link
            key={filter.id}
            href={buildUrl(filter.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-sm",
              isActive ? "text-white shadow-sm" : "bg-white hover:bg-gray-50"
            )}
            style={
              isActive && hasColor
                ? { background: filter.color }
                : isActive
                ? { background: "#2D5750" }
                : { border: "1px solid #C8DAD6", color: "#3D6E65" }
            }
          >
            {filter.icon && <span className="text-base">{filter.icon}</span>}
            <span>{filter.label}</span>
            {filter.count !== undefined && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  isActive ? "bg-white/20" : "bg-gray-100"
                )}
                style={
                  isActive ? { color: "white" } : { color: filter.color || "#5C7872" }
                }
              >
                {filter.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
