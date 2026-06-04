-- Migration: Add unique constraints for RIF and NIF
-- Date: 2026-06-04
-- Description: Prevent duplicate companies with same RIF or NIF

-- Add unique constraint to rif column (allows NULL values)
-- Multiple NULL values are allowed in PostgreSQL unique constraints
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_rif_key" UNIQUE ("rif");

-- Add unique constraint to nif column (allows NULL values)
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_nif_key" UNIQUE ("nif");
