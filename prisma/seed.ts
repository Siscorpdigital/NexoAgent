import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // Verificar si ya existe el usuario proveedor
  const existente = await prisma.usuario.findUnique({
    where: { email: "perofaga@gmail.com" },
  });

  if (existente) {
    console.log("✅ Usuario proveedor ya existe");
    return;
  }

  // Crear usuario proveedor
  const passwordHash = await bcrypt.hash("nexoagent2026", 10);

  await prisma.usuario.create({
    data: {
      email: "perofaga@gmail.com",
      password: passwordHash,
      nombre: "Luis Daniel Fajardo Moreno",
      rol: "PROVEEDOR",
    },
  });

  console.log("✅ Usuario proveedor creado:");
  console.log("   Email: perofaga@gmail.com");
  console.log("   Password: nexoagent2026");
  console.log("   Rol: PROVEEDOR");
  console.log("");
  console.log("⚠️  IMPORTANTE: Cambia esta contraseña después del primer login");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
