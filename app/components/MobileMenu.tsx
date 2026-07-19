"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactElement;
  badge?: number;
};

type MobileMenuProps = {
  navItems: NavItem[];
  empresaId?: string;
  userName: string;
  userRole: string;
  empresaNombre?: string;
  empresaInicial?: string;
  onLogout: () => void;
};

export default function MobileMenu({
  navItems,
  empresaId,
  userName,
  userRole,
  empresaNombre,
  empresaInicial,
  onLogout,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 shadow-sm">
        {/* Logo */}
        <Link href={empresaId ? `/empresa/${empresaId}` : "/admin"}>
          <Image
            src="/logo.png"
            alt="NexoAgent"
            width={140}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            // X Icon
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Hamburger Icon
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRight: "2px solid #2BAA8A" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-200">
          <Image
            src="/logo.png"
            alt="NexoAgent"
            width={180}
            height={50}
            priority
            className="w-full h-auto mb-4"
          />

          {/* Empresa Info (si existe) */}
          {empresaNombre && empresaInicial && (
            <div className="flex items-center gap-2.5 pt-3 border-t border-gray-200">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                style={{ background: "linear-gradient(135deg, #2BAA8A 0%, #2BAA8A 100%)" }}
              >
                {empresaInicial}
              </div>
              <div className="min-w-0">
                <p className="text-gray-900 text-sm font-semibold truncate">{empresaNombre}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-xs text-gray-500">Activo</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const href = empresaId ? `/empresa/${empresaId}${item.href}` : item.href;
            return (
              <Link
                key={item.label}
                href={href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50"
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto text-xs font-bold text-white px-2 py-0.5 rounded-full bg-amber-500">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 space-y-3 border-t border-gray-200">
          <div className="text-xs">
            <div className="font-medium text-gray-900">{userName}</div>
            <div className="mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-medium bg-gradient-to-r from-blue-100 to-emerald-100 text-gray-700">
                {userRole}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left text-xs text-red-500 hover:text-red-600 transition-colors font-medium"
          >
            Cerrar sesión
          </button>
          <p className="text-xs text-gray-400">NexoAgent · Empleado virtual IA</p>
        </div>
      </div>
    </>
  );
}
