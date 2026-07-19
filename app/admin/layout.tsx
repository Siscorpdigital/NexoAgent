import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import KeyboardShortcutsHelp from "@/app/components/KeyboardShortcutsHelp";
import MobileMenu from "@/app/components/MobileMenu";
import ActiveNavLink from "@/app/components/ActiveNavLink";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const navItems = [
    {
      href: "/admin",
      label: "Panel General",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    // "Planes" oculto: single-tenant sin planes (Previsión Familiar).
    {
      href: "/admin/usuarios",
      label: "Usuarios",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F7FA" }}>
      {/* Mobile Menu Component */}
      <MobileMenu
        navItems={navItems}
        userName={session?.user.name || "Usuario"}
        userRole={session?.user.rol || "PROVEEDOR"}
        onLogout={async () => {
          "use server";
          await logout();
        }}
      />

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex w-60 flex-col fixed h-full bg-white shadow-lg" style={{ borderRight: "2px solid #10B981", boxShadow: "4px 0 12px rgba(16, 185, 129, 0.1)" }}>
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div className="mb-3">
            <Image
              src="/logo.png"
              alt="NexoAgent"
              width={180}
              height={50}
              priority
              className="w-full h-auto"
            />
          </div>
          <p className="text-xs text-center mt-3 pt-3 text-gray-500" style={{ borderTop: "1px solid #E5E7EB" }}>Panel Administrador</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider px-3 py-2 text-gray-400" style={{ letterSpacing: "0.1em" }}>Administración</p>

          <ActiveNavLink
            href="/admin"
            exact
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50"
            activeClassName="bg-gradient-to-r from-blue-50 to-emerald-50 text-gray-900 font-semibold shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Panel General
          </ActiveNavLink>

          {/* "Planes" oculto: single-tenant sin planes (Previsión Familiar). */}

          <ActiveNavLink
            href="/admin/usuarios"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50"
            activeClassName="bg-gradient-to-r from-blue-50 to-emerald-50 text-gray-900 font-semibold shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Usuarios
          </ActiveNavLink>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid #E5E7EB" }}>
          {session && (
            <div className="text-xs">
              <div className="font-medium text-gray-900">{session.user.name}</div>
              <div className="text-gray-600">{session.user.email}</div>
              <div className="mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-medium bg-gradient-to-r from-blue-100 to-emerald-100 text-gray-700">{session.user.rol}</span>
              </div>
            </div>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left text-xs text-red-500 hover:text-red-600 transition-colors font-medium"
            >
              Cerrar sesión
            </button>
          </form>
          <p className="text-xs text-gray-400">NexoAgent · v1.0</p>
        </div>
      </aside>

      {/* Main Content - Responsive */}
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0">
        {children}
        <KeyboardShortcutsHelp />
      </main>
    </div>
  );
}
