import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import MobileMenu from "@/app/components/MobileMenu";
import NotificationToggle from "@/app/components/NotificationToggle";
import NotificationSoundPlayer from "@/app/components/NotificationSoundPlayer";
import ScrollToTop from "@/app/components/ScrollToTop";
import GlobalSearch from "@/app/components/GlobalSearch";
import KeyboardShortcutsHelp from "@/app/components/KeyboardShortcutsHelp";
import EmpresaTour from "@/app/components/EmpresaTour";
import ActiveNavLink from "@/app/components/ActiveNavLink";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactElement;
  active?: boolean;
  soon?: boolean;
};

const NAV: NavItem[] = [
  { href: "", label: "Inicio", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, active: true },
  { href: "/conversaciones", label: "Conversaciones", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, active: true },
  { href: "/whatsapp", label: "WhatsApp", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>, active: true },
  { href: "/agentes", label: "Agentes", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, active: true },
  { href: "/crm", label: "CRM", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, active: true },
  { href: "/conocimiento", label: "Conocimiento", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, active: true },
  { href: "/memoria", label: "Memoria", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, active: true },
  { href: "/automatizaciones", label: "Automatizaciones", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, active: true },
  { href: "/agenda", label: "Agenda", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, active: true },
  { href: "/analiticas", label: "Analíticas", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, active: true },
  { href: "/cuenta", label: "Mi Cuenta", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, active: true },
  { href: "/configuracion", label: "Configuración", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, active: true },
  { href: "/soporte", label: "Soporte", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>, active: true },
];

export default async function EmpresaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verificar autenticación
  const session = await auth();
  if (!session) redirect("/login");

  // Verificar permisos: CLIENTE solo puede ver su propia empresa
  if (session.user.rol === "CLIENTE" && session.user.empresaId !== id) {
    redirect(`/empresa/${session.user.empresaId}`);
  }

  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) notFound();

  const pendientes = await prisma.conversacion.count({
    where: { empresaId: id, modoHumano: true },
  });

  // Filtrar navegación según rol
  const esProveedor = session.user.rol === "PROVEEDOR";
  const seccionesRestringidas = ["Conocimiento", "Memoria", "Automatizaciones", "Configuración"];

  const navFiltrada = NAV.filter((item) => {
    // Ocultar secciones restringidas para CLIENTES
    if (!esProveedor && seccionesRestringidas.includes(item.label)) {
      return false;
    }
    return true;
  });

  // Preparar items para el menú móvil
  const mobileNavItems = navFiltrada.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    badge: item.label === "Conversaciones" ? pendientes : undefined,
  }));

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F7FA" }}>
      {/* Mobile Menu Component */}
      <MobileMenu
        navItems={mobileNavItems}
        empresaId={id}
        userName={session.user.name || "Usuario"}
        userRole={session.user.rol}
        empresaNombre={empresa.nombre}
        empresaInicial={empresa.nombre[0]}
        onLogout={async () => {
          "use server";
          await logout();
        }}
      />

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex w-60 flex-col fixed h-full bg-white shadow-lg" style={{ borderRight: "2px solid #2BAA8A", boxShadow: "4px 0 12px rgba(43, 170, 138, 0.1)" }}>
        {/* Logo + empresa */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <Link href="/admin" className="flex items-center gap-1.5 mb-4 text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-xs">← Volver al panel</span>
          </Link>
          <div className="mb-4 px-2">
            <Image
              src="/logo.png"
              alt="NexoAgent"
              width={180}
              height={50}
              priority
              className="w-full h-auto"
            />
          </div>
          <div className="flex items-center gap-2.5 pt-3" style={{ borderTop: "1px solid #E5E7EB" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-sora font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #2BAA8A 0%, #2BAA8A 100%)" }}>
              {empresa.nombre[0]}
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 text-sm font-semibold font-sora truncate leading-tight">{empresa.nombre}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22B26B" }}></span>
                <span className="text-xs" style={{ color: "#73869A" }}>Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navFiltrada.map((item) => {
            const href = `/empresa/${id}${item.href}`;
            if (item.soon) {
              return (
                <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm opacity-30 cursor-not-allowed select-none" style={{ color: "#A9BED2" }}>
                  {item.icon}
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs opacity-60">Pronto</span>
                </div>
              );
            }
            return (
              <ActiveNavLink
                key={item.label}
                href={href}
                exact={item.href === ""}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 group"
                activeClassName="bg-gradient-to-r from-blue-50 to-emerald-50 text-gray-900 font-semibold shadow-sm"
              >
                <span className="transition-colors">{item.icon}</span>
                <span>{item.label}</span>
                {item.label === "Conversaciones" && pendientes > 0 && (
                  <span className="ml-auto text-xs font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: "#F0A93B" }}>
                    {pendientes}
                  </span>
                )}
              </ActiveNavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid #E5E7EB" }}>
          {/* Botón de notificaciones */}
          <div className="mb-3">
            <NotificationToggle empresaId={id} />
          </div>

          <div className="text-xs">
            <div className="font-medium text-gray-900">{session.user.name}</div>
            <div className="mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-medium bg-gradient-to-r from-blue-100 to-emerald-100 text-gray-700">
                {session.user.rol}
              </span>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left text-xs text-red-500 hover:text-red-600 transition-colors font-medium"
            >
              Cerrar sesión
            </button>
          </form>
          <p className="text-xs text-gray-400">NexoAgent · Empleado virtual IA</p>
        </div>
      </aside>

      {/* Main Content - Responsive */}
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</div>
      </main>

      {/* Componentes globales */}
      <NotificationSoundPlayer />
      <ScrollToTop />
      <GlobalSearch empresaId={id} />
      <KeyboardShortcutsHelp />
      <EmpresaTour empresaId={id} />
    </div>
  );
}
