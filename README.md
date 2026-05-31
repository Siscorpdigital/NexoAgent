# 🤖 NexoAgent

**Plataforma multi-tenant de agentes conversacionales inteligentes para WhatsApp**

NexoAgent es un sistema completo de asistentes virtuales potenciados por IA (Claude de Anthropic) que permite a las empresas automatizar y mejorar sus conversaciones con clientes a través de WhatsApp. Incluye gestión de conocimiento, CRM integrado, automatizaciones, analíticas y calendario de citas.

> 📚 **Guías rápidas**: 
> - [🚀 Deploy en Render](QUICKSTART-RENDER.md)
> - [📦 Deployment completo](DEPLOYMENT.md)
> - [🔒 Seguridad](SECURITY.md)

---

## ✨ Características principales

### 🧠 **Conocimiento (RAG)**
- Sube documentos (PDF, texto) para entrenar al agente
- Búsqueda semántica por chunks con relevancia
- El agente responde basándose en documentación real de la empresa

### 💬 **Conversaciones inteligentes**
- Mensajes en tiempo real vía WhatsApp
- Modo agente IA + modo humano
- Historial completo de conversaciones
- Contexto persistente por contacto

### 👥 **CRM integrado**
- Gestión de contactos (Leads, Clientes, Proveedores)
- Notas y seguimiento por contacto
- Historial de conversaciones asociado
- Vista detallada de cada contacto

### 🧠 **Memoria estructurada**
- Productos y servicios
- Horarios de atención
- Precios y promociones
- Políticas de la empresa
- El agente consulta esta información en tiempo real

### ⚡ **Automatizaciones**
- Mensaje automático de bienvenida (primer contacto)
- Respuestas por palabras clave
- Mensaje fuera de horario
- Control de ejecuciones

### 📅 **Agenda de citas**
- Crear, confirmar y cancelar citas
- Integración con Calendly
- Vista de citas futuras, pasadas y canceladas
- Vinculación automática con contactos

### 📊 **Analíticas**
- Total de conversaciones y contactos
- Mensajes atendidos por IA vs. humanos
- Tiempo ahorrado estimado
- Gráficos de actividad (últimos 7 días)
- Distribución de mensajes por día

### ⚙️ **Configuración avanzada**
- Prompt del sistema personalizable
- WhatsApp Business conectado
- Gestión multi-empresa

---

## 🏗️ Arquitectura técnica

### Stack tecnológico
- **Frontend**: Next.js 16 (App Router) + React 19 + TailwindCSS 4
- **Backend**: Next.js API Routes (Server Actions)
- **Base de datos**: PostgreSQL + Prisma ORM
- **IA**: Claude 4.5 (Anthropic API) con tool calling
- **WhatsApp**: Meta WhatsApp Business API

### Estructura del proyecto
```
nexoagent/
├── app/
│   ├── actions/              # Server Actions
│   │   ├── agenda.ts
│   │   ├── automatizaciones.ts
│   │   ├── conocimiento.ts
│   │   ├── crm.ts
│   │   └── memoria.ts
│   ├── api/                  # API Routes
│   │   ├── empresa/          # APIs por empresa
│   │   ├── health/           # Health check
│   │   └── webhook/          # WhatsApp webhook
│   ├── dashboard/            # Admin dashboard
│   ├── empresa/[id]/         # Panel por empresa
│   │   ├── agenda/
│   │   ├── analiticas/
│   │   ├── automatizaciones/
│   │   ├── configuracion/
│   │   ├── conocimiento/
│   │   ├── conversaciones/
│   │   ├── crm/
│   │   └── memoria/
│   └── lib/                  # Utilidades
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos
│   └── migrations/           # Migraciones
└── public/
```

### Modelos de datos principales
- **Empresa**: Configuración multi-tenant
- **Conversacion**: Hilos de chat
- **Mensaje**: Mensajes individuales (cliente/asistente)
- **Contacto**: CRM de contactos
- **Documento**: Base de conocimiento
- **DocumentoChunk**: Chunks para RAG
- **MemoriaEmpresa**: Datos estructurados (productos, horarios, precios, políticas)
- **Automatizacion**: Reglas de automatización
- **Cita**: Calendario de citas

---

## 🚀 Instalación y configuración

### Prerequisitos
- Node.js 18+ 
- PostgreSQL 14+
- Cuenta de Anthropic (API key)
- Cuenta de Meta WhatsApp Business (opcional, para producción)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/nexoagent.git
cd nexoagent
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia el archivo de ejemplo y configura tus credenciales:
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/nexoagent_dev
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

### 4. Crear base de datos
```bash
# Crear la base de datos PostgreSQL
createdb nexoagent_dev

# Ejecutar migraciones
npx prisma migrate dev
```

### 5. Generar cliente de Prisma
```bash
npx prisma generate
```

### 6. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment a producción

### Build de producción
```bash
npm run build
npm start
```

### Variables de entorno para producción
Asegúrate de configurar:
- `DATABASE_URL`: PostgreSQL en producción (ej: Supabase, Railway, Neon)
- `ANTHROPIC_API_KEY`: Tu API key de Anthropic
- `WHATSAPP_TOKEN`: Token de Meta WhatsApp Business
- `WHATSAPP_VERIFY_TOKEN`: Token de verificación del webhook
- `WHATSAPP_PHONE_NUMBER_ID`: ID del número de WhatsApp
- `NEXT_PUBLIC_APP_URL`: URL pública de tu app

### Plataformas recomendadas
- **Vercel** (recomendado para Next.js)
- **Railway**
- **Render**
- **DigitalOcean App Platform**

### Configurar webhook de WhatsApp
1. En Meta Developer Console, configura el webhook URL:
   ```
   https://tu-dominio.com/api/webhook
   ```
2. Usa el `WHATSAPP_VERIFY_TOKEN` que configuraste
3. Suscríbete a los eventos: `messages`, `messaging_postbacks`

---

## 🔐 Seguridad

- ✅ Validación de inputs en todas las Server Actions
- ✅ Sanitización de datos de usuario
- ✅ Protección contra SQL injection (Prisma ORM)
- ✅ Variables de entorno para secretos
- ✅ Rate limiting en API endpoints (recomendado añadir en producción)

### Mejoras de seguridad recomendadas para producción
- Implementar autenticación (NextAuth.js)
- Rate limiting con Upstash o similar
- CORS configurado correctamente
- Headers de seguridad (helmet)
- Logging y monitoreo (Sentry, LogRocket)

---

## 🧪 Testing

```bash
# Ejecutar linter
npm run lint

# Build de prueba
npm run build
```

---

## 📚 Documentación de módulos

### Módulo Conocimiento (RAG)
- Sube documentos en formato PDF o texto
- Los documentos se dividen en chunks de ~500 caracteres
- Búsqueda semántica por relevancia usando embeddings (futuro)
- Actualmente usa búsqueda por texto con límite de 3 chunks más relevantes

### Módulo Automatizaciones
- **Primer mensaje**: Se envía automáticamente al primer contacto de un nuevo cliente
- **Palabra clave**: Detecta palabras específicas y responde con mensaje predefinido
- **Fuera de horario**: Mensaje automático cuando se escribe fuera del horario configurado

### Módulo Memoria
Almacena datos estructurados en 4 categorías:
- **Productos**: Catálogo de productos/servicios
- **Horarios**: Días y horas de atención
- **Precios**: Tarifas, promociones, descuentos
- **Políticas**: Términos, devoluciones, garantías

### Módulo Agenda
- Crear citas con cliente, teléfono, fecha/hora, duración
- Estados: Pendiente, Confirmada, Cancelada
- Integración con Calendly (opcional)
- Vista de próximas citas, historial y canceladas

### Módulo CRM
- Tipos de contacto: Lead, Cliente, Proveedor
- Notas por contacto
- Historial completo de conversaciones
- Vista detallada individual

### Módulo Analíticas
- KPIs: conversaciones, mensajes IA/humano, contactos nuevos
- Tiempo ahorrado (estimado 3 min por mensaje de IA)
- Gráfico de actividad de mensajes (últimos 7 días)
- Distribución de mensajes IA vs. cliente

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 📞 Soporte

Para preguntas o soporte:
- Email: perofaga@gmail.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/nexoagent/issues)

---

**Desarrollado con ❤️ usando Claude Code**
