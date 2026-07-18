-- ===================================================================
-- Migración 001 — Cotizaciones "por emitir"
-- ===================================================================
-- Agrega el estado "pendiente de emisión" a las cotizaciones, para poder
-- guardar una cotización y completar su emisión (planilla) más adelante.
--
-- Cómo aplicarla:
--   Supabase → SQL Editor → pegar y ejecutar este archivo (una sola vez).
--
-- Notas:
--   * Idempotente: usa IF NOT EXISTS, se puede ejecutar varias veces sin error.
--   * Las filas existentes quedan en false (no marcadas).
--   * No requiere cambios de RLS: el marcado usa UPDATE sobre cotizaciones,
--     cubierto por las políticas que ya usa el cotizador (p. ej. email_enviado).
-- ===================================================================

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS para_emitir boolean NOT NULL DEFAULT false;
