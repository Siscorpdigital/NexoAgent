import { z } from "zod";

// ============================================
// VALIDACIONES DE EMPRESA
// ============================================

export const crearEmpresaSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  telefono: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^\+?[0-9]+$/, "El teléfono solo puede contener números y el símbolo +")
    .trim(),
  rif: z.string().max(50).trim().optional().nullable(),
  nif: z.string().max(50).trim().optional().nullable(),
  responsable: z.string().max(100).trim().optional().nullable(),
  direccion: z.string().max(500).trim().optional().nullable(),
  email: z.string().email("Email inválido").max(100).trim().optional().nullable(),
});

export const editarEmpresaSchema = z.object({
  id: z.string().cuid("ID inválido"),
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  telefono: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^\+?[0-9]+$/, "El teléfono solo puede contener números y el símbolo +")
    .trim(),
  rif: z.string().max(50).trim().optional().nullable(),
  nif: z.string().max(50).trim().optional().nullable(),
  responsable: z.string().max(100).trim().optional().nullable(),
  direccion: z.string().max(500).trim().optional().nullable(),
  email: z.string().email("Email inválido").max(100).trim().optional().nullable(),
});

export const actualizarPromptSchema = z.object({
  id: z.string().cuid("ID inválido"),
  prompt: z.string().max(5000, "El prompt no puede exceder 5000 caracteres").trim().nullable(),
  origen: z.enum(["empresa", "admin"]).optional(),
});

// ============================================
// VALIDACIONES DE CONTACTO (CRM)
// ============================================

export const crearContactoSchema = z.object({
  empresaId: z.string().cuid("ID de empresa inválido"),
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim()
    .optional()
    .nullable(),
  telefono: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^\+?[0-9]+$/, "El teléfono solo puede contener números y el símbolo +")
    .trim(),
  tipo: z.enum(["LEAD", "CLIENTE", "PROVEEDOR"]),
  notas: z.string().max(1000, "Las notas no pueden exceder 1000 caracteres").trim().optional().nullable(),
});

export const actualizarContactoSchema = z.object({
  id: z.string().cuid("ID inválido"),
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim()
    .optional()
    .nullable(),
  tipo: z.enum(["LEAD", "CLIENTE", "PROVEEDOR"]),
  notas: z.string().max(1000, "Las notas no pueden exceder 1000 caracteres").trim().optional().nullable(),
});

// ============================================
// VALIDACIONES DE AGENDA/CITAS
// ============================================

export const crearCitaSchema = z.object({
  empresaId: z.string().cuid("ID de empresa inválido"),
  nombreCliente: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  telefono: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^\+?[0-9]+$/, "El teléfono solo puede contener números y el símbolo +")
    .trim(),
  inicio: z.coerce.date(),
  fin: z.coerce.date(),
  notas: z.string().max(1000, "Las notas no pueden exceder 1000 caracteres").trim().optional().nullable(),
}).refine((data) => data.fin > data.inicio, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["fin"],
});

export const actualizarCitaSchema = z.object({
  id: z.string().cuid("ID inválido"),
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "CANCELADA"]),
  notas: z.string().max(1000, "Las notas no pueden exceder 1000 caracteres").trim().optional().nullable(),
});

// ============================================
// VALIDACIONES DE MEMORIA
// ============================================

export const guardarMemoriaSchema = z.object({
  empresaId: z.string().cuid("ID de empresa inválido"),
  categoria: z.enum(["PRODUCTO", "HORARIO", "PRECIO", "POLITICA"]),
  clave: z
    .string()
    .min(1, "La clave es requerida")
    .max(200, "La clave no puede exceder 200 caracteres")
    .trim(),
  valor: z
    .string()
    .min(1, "El valor es requerido")
    .max(2000, "El valor no puede exceder 2000 caracteres")
    .trim(),
});

export const eliminarMemoriaSchema = z.object({
  id: z.string().cuid("ID inválido"),
});

// ============================================
// VALIDACIONES DE AUTOMATIZACIONES
// ============================================

export const crearAutomatizacionSchema = z.object({
  empresaId: z.string().cuid("ID de empresa inválido"),
  nombre: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  trigger: z.enum(["PRIMER_MENSAJE", "PALABRA_CLAVE", "FUERA_HORARIO"]),
  condicion: z.string().max(200, "La condición no puede exceder 200 caracteres").trim().optional().nullable(),
  mensaje: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(1000, "El mensaje no puede exceder 1000 caracteres")
    .trim(),
  activa: z.boolean().default(true),
});

export const actualizarAutomatizacionSchema = z.object({
  id: z.string().cuid("ID inválido"),
  nombre: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim()
    .optional(),
  condicion: z.string().max(200, "La condición no puede exceder 200 caracteres").trim().optional().nullable(),
  mensaje: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(1000, "El mensaje no puede exceder 1000 caracteres")
    .trim()
    .optional(),
  activa: z.boolean().optional(),
});

export const eliminarAutomatizacionSchema = z.object({
  id: z.string().cuid("ID inválido"),
});

// ============================================
// VALIDACIONES DE DOCUMENTOS/CONOCIMIENTO
// ============================================

export const subirDocumentoSchema = z.object({
  empresaId: z.string().cuid("ID de empresa inválido"),
  nombre: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres")
    .trim(),
  contenido: z
    .string()
    .min(10, "El contenido debe tener al menos 10 caracteres")
    .max(100000, "El contenido no puede exceder 100,000 caracteres"),
  tipo: z.string().max(50).default("texto"),
});

export const eliminarDocumentoSchema = z.object({
  id: z.string().cuid("ID inválido"),
  empresaId: z.string().cuid("ID de empresa inválido"),
});

// ============================================
// VALIDACIONES DE USUARIO/AUTH
// ============================================

export const crearUsuarioSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .max(100, "El email no puede exceder 100 caracteres")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  rol: z.enum(["PROVEEDOR", "CLIENTE"]),
  empresaId: z.string().cuid("ID de empresa inválido").optional().nullable(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .trim()
    .toLowerCase(),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const actualizarUsuarioSchema = z.object({
  id: z.string().cuid("ID inválido"),
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Email inválido")
    .max(100, "El email no puede exceder 100 caracteres")
    .trim()
    .toLowerCase()
    .optional(),
  rol: z.enum(["PROVEEDOR", "CLIENTE"]).optional(),
});

// ============================================
// UTILIDADES DE VALIDACIÓN
// ============================================

/**
 * Sanitiza un string eliminando caracteres peligrosos
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Eliminar < y > para prevenir XSS
    .replace(/[\x00-\x1F\x7F]/g, ""); // Eliminar caracteres de control
}

/**
 * Sanitiza un número de teléfono
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

/**
 * Valida que un ID sea un CUID válido
 */
export function isValidCuid(id: string): boolean {
  return /^c[a-z0-9]{24,25}$/i.test(id);
}

/**
 * Helper para validar y parsear datos con Zod
 */
export async function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const parsed = await schema.parseAsync(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}
