-- Tarjetas de presentación digitales (Previsión Familiar)
CREATE TABLE "TarjetaDigital" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "celular" TEXT,
    "whatsapp" TEXT,
    "web" TEXT,
    "foto" TEXT,
    "extras" JSONB NOT NULL DEFAULT '[]',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "escaneos" INTEGER NOT NULL DEFAULT 0,
    "contactosGuardados" INTEGER NOT NULL DEFAULT 0,
    "ultimoEscaneo" TIMESTAMP(3),
    "creadoPor" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarjetaDigital_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TarjetaDigital_token_key" ON "TarjetaDigital"("token");

CREATE TABLE "TarjetaEvento" (
    "id" TEXT NOT NULL,
    "tarjetaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dispositivo" TEXT,
    "ciudad" TEXT,
    "pais" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarjetaEvento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TarjetaEvento_tarjetaId_creadoEn_idx" ON "TarjetaEvento"("tarjetaId", "creadoEn");

ALTER TABLE "TarjetaEvento" ADD CONSTRAINT "TarjetaEvento_tarjetaId_fkey"
    FOREIGN KEY ("tarjetaId") REFERENCES "TarjetaDigital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Solo el servidor (dueño de las tablas) accede a estos datos: con RLS activo y
-- sin políticas, la API pública de Supabase (roles anon/authenticated) no puede
-- listar tokens ni datos de contacto.
ALTER TABLE "TarjetaDigital" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TarjetaEvento" ENABLE ROW LEVEL SECURITY;
