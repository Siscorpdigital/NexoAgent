import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F7FA" }}>
      <aside className="w-60 flex flex-col fixed h-full" style={{ background: "#0E2436" }}>
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl grad-bg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm font-sora">N</span>
            </div>
            <div>
              <span className="text-white font-bold text-base font-sora">
                Nexo<span className="grad-text">Agent</span>
              </span>
              <p className="text-xs mt-0.5" style={{ color: "#41566B" }}>Panel administrador</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wider px-3 py-2" style={{ color: "#41566B", letterSpacing: "0.1em" }}>Administración</p>

          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:text-white hover:bg-white/5 group" style={{ color: "#A9BED2" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Panel General
          </Link>

          <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:text-white hover:bg-white/5 group" style={{ color: "#A9BED2" }}>
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
        {children}
      </main>
    </div>
  );
}
