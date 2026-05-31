import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen flex" style={{ background: "#F4F7FA" }}>
      <aside className="w-60 flex flex-col fixed h-full" style={{ background: "#0E2436" }}>
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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
          <p className="text-xs text-center mt-3 pt-3" style={{ color: "#73869A", borderTop: "1px solid rgba(255,255,255,0.08)" }}>Panel Administrador</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider px-3 py-2" style={{ color: "#41566B", letterSpacing: "0.1em" }}>Administración</p>
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:text-white group" style={{ color: "#A9BED2" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Empresas
          </Link>
          <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:text-white group" style={{ color: "#A9BED2" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Usuarios
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {session && (
            <div className="text-xs text-gray-400">
              <div className="font-medium text-white">{session.user.name}</div>
              <div>{session.user.email}</div>
              <div className="mt-1 text-blue-400">{session.user.rol}</div>
            </div>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
          <p className="text-xs" style={{ color: "#41566B" }}>NexoAgent · v1.0</p>
        </div>
      </aside>

      <main className="flex-1 ml-60">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
