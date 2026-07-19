import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Sembrando base de datos de producción...");
  console.log("");

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@nexoagent.com" },
    update: {},
    create: {
      email: "admin@nexoagent.com",
      password: hashedPassword,
      nombre: "Administrador",
      rol: "PROVEEDOR",
    },
  });

  console.log("✅ Usuario administrador creado:");
  console.log("   Email:", admin.email);
  console.log("   Password: Admin123!");
  console.log("   Rol:", admin.rol);
  console.log("");

  // Plan interno ILIMITADO (single-tenant Previsión Familiar).
  // max = -1 significa sin límite; checkPlanLimit lo interpreta así.
  const planIlimitado = await prisma.plan.upsert({
    where: { nombre: "Previsión Familiar (Ilimitado)" },
    update: {},
    create: {
      nombre: "Previsión Familiar (Ilimitado)",
      descripcion: "Plan interno sin límites",
      precio: 0,
      maxWhatsApps: -1,
      maxAgentes: -1,
      maxConversacionesMes: -1,
      maxDocumentosMB: -1,
      transferenciaAgentes: true,
      ruteoInteligente: true,
      analyticsAvanzados: true,
      apiPersonalizada: true,
      soportePrioritario: true,
      horariosPersonalizados: true,
      visible: false,
      orden: 0,
    },
  });
  console.log("✅ Plan ilimitado listo:", planIlimitado.nombre);

  // Empresa única (single-tenant): Previsión Familiar
  const empresa = await prisma.empresa.upsert({
    where: { telefonoWhatsapp: "+584121234567" },
    update: { planId: planIlimitado.id },
    create: {
      nombre: "Previsión Familiar",
      telefonoWhatsapp: "+584121234567",
      email: "contacto@previsionfamiliar.com.ve",
      responsable: "Administrador",
      planId: planIlimitado.id,
      promptSistema: `Eres el asistente virtual de Previsión Familiar, C.A.

Eres amable, profesional y cercano. Nunca revelas que eres una IA.

Tu misión es:
- Atender consultas sobre planes de previsión y servicios funerarios
- Orientar sobre coberturas, afiliación y formas de pago
- Agendar citas y capturar datos de clientes potenciales
- Derivar a un asesor humano cuando sea necesario

Siempre respondes en español de forma clara, cálida y concisa.`,
    },
  });

  console.log("✅ Empresa demo creada:");
  console.log("   Nombre:", empresa.nombre);
  console.log("   Teléfono WhatsApp:", empresa.telefonoWhatsapp);
  console.log("   Email:", empresa.email);
  console.log("");

  // Vincular usuario con empresa
  await prisma.usuario.update({
    where: { id: admin.id },
    data: { empresaId: empresa.id },
  });

  console.log("✅ Usuario vinculado a empresa");
  console.log("");

  // Crear memoria estructurada inicial
  const memorias = [
    {
      categoria: "PRODUCTO" as const,
      clave: "Servicio Principal",
      valor: "Asistente Virtual con IA para WhatsApp",
    },
    {
      categoria: "HORARIO" as const,
      clave: "Atención",
      valor: "Lunes a Viernes de 9:00 AM a 6:00 PM",
    },
    {
      categoria: "PRECIO" as const,
      clave: "Plan Básico",
      valor: "$49/mes - Hasta 1000 mensajes",
    },
    {
      categoria: "POLITICA" as const,
      clave: "Privacidad",
      valor: "Protegemos tus datos según GDPR y LOPD",
    },
  ];

  // Verificar si ya existen memorias
  const memoriasExistentes = await prisma.memoriaEmpresa.findMany({
    where: { empresaId: empresa.id },
  });

  if (memoriasExistentes.length === 0) {
    for (const memoria of memorias) {
      await prisma.memoriaEmpresa.create({
        data: {
          empresaId: empresa.id,
          categoria: memoria.categoria,
          clave: memoria.clave,
          valor: memoria.valor,
        },
      });
    }
  }

  console.log("✅ Memoria estructurada inicial creada:");
  console.log(`   ${memorias.length} entradas agregadas`);
  console.log("");

  // Crear automatizaciones iniciales
  const automatizaciones = [
    {
      nombre: "Mensaje de Bienvenida",
      trigger: "PRIMER_MENSAJE" as const,
      condicion: null,
      mensaje: `¡Hola! 👋 Soy Katy, tu asistente virtual de Empresa Demo.

¿En qué puedo ayudarte hoy?

Puedo:
- Responder tus consultas
- Agendar una cita
- Darte información sobre nuestros servicios`,
    },
    {
      nombre: "Fuera de Horario",
      trigger: "FUERA_HORARIO" as const,
      condicion: null,
      mensaje: `Gracias por contactarnos. 🕐

Actualmente estamos fuera de nuestro horario de atención (Lunes a Viernes, 9:00 AM - 6:00 PM).

Déjanos tu mensaje y te responderemos lo antes posible. También puedes agendar una cita para que te contactemos.`,
    },
  ];

  for (const auto of automatizaciones) {
    await prisma.automatizacion.create({
      data: {
        empresaId: empresa.id,
        nombre: auto.nombre,
        trigger: auto.trigger,
        condicion: auto.condicion,
        mensaje: auto.mensaje,
        activa: true,
      },
    });
  }

  console.log("✅ Automatizaciones iniciales creadas:");
  console.log(`   ${automatizaciones.length} automatizaciones activas`);
  console.log("");

  console.log("🎉 ¡Base de datos sembrada exitosamente!");
  console.log("");
  console.log("📝 Credenciales de acceso:");
  console.log("   URL: http://localhost:3000/login");
  console.log("   Email: admin@nexoagent.com");
  console.log("   Password: Admin123!");
  console.log("");
  console.log("⚠️  IMPORTANTE: Cambia la contraseña después del primer login");
}

main()
  .catch((e) => {
    console.error("❌ Error al sembrar la base de datos:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
