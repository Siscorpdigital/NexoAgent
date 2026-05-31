-- CreateEnum
CREATE TYPE "CategoriaMemoria" AS ENUM ('PRODUCTO', 'HORARIO', 'PRECIO', 'POLITICA');

-- CreateTable
CREATE TABLE "MemoriaEmpresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "categoria" "CategoriaMemoria" NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoriaEmpresa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemoriaEmpresa" ADD CONSTRAINT "MemoriaEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
