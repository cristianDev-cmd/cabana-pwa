"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const clienteLinks = [
    { href: "/cabanas", label: "🏡 Cabañas" },
    { href: "/saldo", label: "💰 Saldo" },
    { href: "/reservas", label: "📅 Reservas" },
    { href: "/dashboard", label: "📊 Dashboard" },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "📊 Dashboard" },
    { href: "/admin/usuarios", label: "👥 Usuarios" },
    { href: "/admin/cabanas", label: "🏡 Cabañas" },
    { href: "/admin/saldo", label: "💳 Validar Saldo" },
    { href: "/admin/tarifas", label: "💲 Tarifas" },
    { href: "/admin/auditoria", label: "🔍 Auditoría" },
  ];

  const links = user?.role === "admin" ? adminLinks : clienteLinks;

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-gray-200 dark:border-zinc-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary text-2xl">🏡</span>
            <span className="hidden sm:inline bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              CabanaPWA
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <Link href={user?.role === "admin" ? "/admin/dashboard" : "/perfil"} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {user?.nombre?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="hidden sm:block text-sm font-medium">{user?.nombre}</span>
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-zinc-700 pt-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-danger hover:bg-danger/5 transition-colors mt-2"
            >
              🚪 Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
