-- Pre-check: Verificar si hay RIF o NIF duplicados antes de aplicar constraints

-- Verificar RIF duplicados (excluyendo NULL)
SELECT
  rif,
  COUNT(*) as count,
  STRING_AGG(id, ', ') as empresa_ids
FROM "Empresa"
WHERE rif IS NOT NULL
GROUP BY rif
HAVING COUNT(*) > 1;

-- Verificar NIF duplicados (excluyendo NULL)
SELECT
  nif,
  COUNT(*) as count,
  STRING_AGG(id, ', ') as empresa_ids
FROM "Empresa"
WHERE nif IS NOT NULL
GROUP BY nif
HAVING COUNT(*) > 1;

-- Si no hay resultados, es seguro aplicar los constraints
