/**
 * Lógica pura de acceso al módulo agente (sin dependencias de servidor, para
 * poder usarla también en el cliente, p. ej. en el formulario de login).
 *
 *   - superadmin / admin  → acceso por rol.
 *   - coordinador / agente → acceso solo si acceso_nexo = true.
 *   - resto → sin acceso.
 * Todos los autorizados operan como PROVEEDOR (staff, single-tenant).
 */
export type RolNexo = "PROVEEDOR" | "CLIENTE";

export function mapAcceso(
  profileRol: string | null | undefined,
  accesoNexo: boolean,
): { authorized: boolean; rol: RolNexo; esAdmin: boolean } {
  const r = (profileRol || "").toLowerCase();
  const esAdmin = r === "admin" || r === "superadmin";
  if (esAdmin) return { authorized: true, rol: "PROVEEDOR", esAdmin: true };
  if ((r === "coordinador" || r === "agente") && accesoNexo)
    return { authorized: true, rol: "PROVEEDOR", esAdmin: false };
  return { authorized: false, rol: "CLIENTE", esAdmin: false };
}
