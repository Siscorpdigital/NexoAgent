# 🔐 Sistema de Autenticación - Estado de Implementación

## ✅ COMPLETADO (Listo para usar)

### **1. Autenticación básica**
- ✅ NextAuth.js v5 configurado
- ✅ Login con email/password
- ✅ Estrategia JWT
- ✅ Página de login en `/login`

### **2. Modelos de datos**
- ✅ Usuario con roles (PROVEEDOR/CLIENTE)
- ✅ Empresa con datos completos (RIF, dirección, etc)
- ✅ Relación Usuario <-> Empresa

### **3. Protección de rutas**
- ✅ Middleware que protege /dashboard, /empresa, /admin
- ✅ Solo PROVEEDOR puede acceder a /admin
- ✅ Redirección automática a /login

### **4. Usuario inicial**
- ✅ Usuario proveedor creado:
  - **Email**: perofaga@gmail.com
  - **Password**: nexoagent2026
  - **Rol**: PROVEEDOR

---

## ⏳ PENDIENTE (Para completar el sistema)

### **Tarea #14: Panel de Administración**
Crear `/app/admin/page.tsx` para que tú (proveedor) puedas:
- Ver lista de todas las empresas
- Crear nuevas empresas
- Ver/editar datos de clientes (RIF, responsable, etc)
- Crear usuarios CLIENTE para cada empresa

**Archivos necesarios:**
```
app/admin/page.tsx
app/admin/empresas/nueva/page.tsx
app/actions/admin.ts
```

### **Tarea #15: Sistema de permisos por secciones**
Modificar módulos para aplicar permisos:

**CLIENTE puede:**
- ✅ Ver: Conversaciones, Agenda, CRM, Analíticas
- ❌ NO editar: Conocimiento, Memoria, Automatizaciones, Config

**PROVEEDOR puede:**
- ✅ TODO lo que puede CLIENTE
- ✅ Editar Conocimiento, Memoria, Automatizaciones
- ✅ Conectar/desconectar Google Calendar
- ✅ Ver panel /admin

**Implementación:**
Envolver secciones sensibles con verificación de rol:
```typescript
const session = await auth();
if (session?.user.rol !== "PROVEEDOR") {
  return <div>No tienes permiso</div>;
}
```

### **Tarea #16: Navegación adaptativa**
Actualizar `/app/empresa/[id]/layout.tsx`:
- Ocultar "Conocimiento", "Memoria", "Automatizaciones" si rol === CLIENTE
- Mostrar link a "/admin" solo si rol === PROVEEDOR

---

## 🚀 CÓMO PROBAR AHORA MISMO

### **1. Aplicar migración en producción (Render)**
```bash
# En el Shell de Render:
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

### **2. Probar el login**
1. Ve a: `https://nexoagent.onrender.com/login`
2. Email: `perofaga@gmail.com`
3. Password: `nexoagent2026`
4. Deberías ser redirigido a `/dashboard`

### **3. Verificar protección de rutas**
- Sin login → intenta ir a /dashboard → redirige a /login ✅
- Con login → accedes a /dashboard ✅

---

## 📋 PRÓXIMOS PASOS RECOMENDADOS

### **Paso 1: Panel Admin (30-45 min)**

Crear archivo: `app/admin/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  
  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect("/dashboard");
  }

  const empresas = await prisma.empresa.findMany({
    include: {
      usuario: true,
      _count: {
        select: {
          conversaciones: true,
          contactos: true,
          citas: true,
        },
      },
    },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <Link
            href="/admin/empresas/nueva"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Nueva Empresa
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estadísticas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {empresas.map((empresa) => (
                <tr key={empresa.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{empresa.nombre}</div>
                    {empresa.rif && <div className="text-sm text-gray-500">{empresa.rif}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{empresa.responsable || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{empresa.email || "-"}</div>
                    <div className="text-sm text-gray-500">{empresa.telefono || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empresa._count.conversaciones} conv • {empresa._count.contactos} contactos • {empresa._count.citas} citas
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/empresa/${empresa.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/empresas/${empresa.id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### **Paso 2: Formulario Nueva Empresa (20-30 min)**

Crear archivo: `app/admin/empresas/nueva/page.tsx`
Crear actions en: `app/actions/admin.ts`

Ver ejemplos completos en cualquier formulario existente del proyecto.

### **Paso 3: Ocultar secciones según rol (10-15 min)**

En `app/empresa/[id]/layout.tsx`, filtrar el array `NAV`:

```typescript
const session = await auth();
const esProveedor = session?.user.rol === "PROVEEDOR";

const NAV_FILTRADO = NAV.filter(item => {
  // Ocultar estas secciones para CLIENTES
  if (!esProveedor && ["Conocimiento", "Memoria", "Automatizaciones", "Configuración"].includes(item.label)) {
    return false;
  }
  return true;
});
```

---

## 🔑 CREDENCIALES INICIALES

```
Email: perofaga@gmail.com
Password: nexoagent2026
Rol: PROVEEDOR
```

⚠️ **IMPORTANTE**: Cambia esta contraseña después del primer login en producción.

---

## 📚 DOCUMENTACIÓN ADICIONAL

- [NextAuth.js Docs](https://next-auth.js.org/)
- Archivo de configuración: `/lib/auth.ts`
- Middleware: `/middleware.ts`
- Tipos: `/types/next-auth.d.ts`

---

**Estado**: 70% completado
**Tiempo estimado para completar**: 1-2 horas
**Última actualización**: 31 Mayo 2026
