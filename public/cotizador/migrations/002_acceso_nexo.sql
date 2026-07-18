-- ===================================================================
-- Migración 002 — Permiso de acceso a NexoAgent
-- ===================================================================
-- Agrega el permiso por usuario para acceder al módulo NexoAgent desde
-- el panel del cotizador. Admin y SuperAdmin tienen acceso siempre; a los
-- demás usuarios se les concede activando esta casilla.
--
-- Cómo aplicarla:
--   Supabase → SQL Editor → pegar y ejecutar (una sola vez).
--
-- Notas:
--   * Idempotente: usa IF NOT EXISTS.
--   * Las filas existentes quedan en false (sin acceso), salvo admin/superadmin
--     que reciben acceso por rol en la aplicación (no por esta columna).
--   * No requiere cambios de RLS: se actualiza vía UPDATE sobre profiles,
--     cubierto por las políticas que ya usa la gestión de usuarios.
-- ===================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS acceso_nexo boolean NOT NULL DEFAULT false;
