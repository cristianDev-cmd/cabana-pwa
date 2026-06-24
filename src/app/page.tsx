"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Bienvenido a CabanaPWA
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md">
              Tu plataforma para reservar cabañas increíbles con saldo prepago.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cabanas" className="btn-primary text-center">
                Explorar Cabañas 🏡
              </Link>
              <Link href="/saldo" className="btn-secondary text-center">
                Cargar Saldo 💰
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-zinc-900 dark:via-zinc-900 dark:to-primary/5">
      <header className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-2xl">
          <span>🏡</span>
          <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            CabanaPWA
          </span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-sm px-4 py-2">Iniciar Sesión</Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2">Registrarse</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-24">
        <div className="text-center space-y-8 animate-fade-in">
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
            Encontrá la cabaña
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              perfecta para vos
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Reservá cabañas increíbles con nuestro sistema de saldo prepago. 
            Simple, seguro y sin complicaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Comenzar ahora ✨
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4">
              Ya tengo cuenta
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 max-w-4xl mx-auto">
            {[
              { emoji: "💰", title: "Saldo Prepago", desc: "Cargá saldo por transferencia y usalo al instante" },
              { emoji: "📅", title: "Reservas Fáciles", desc: "Calendario dinámico con precios claros" },
              { emoji: "🔒", title: "100% Seguro", desc: "Validación de identidad y comprobantes" },
            ].map((f, i) => (
              <div key={i} className="card bg-white dark:bg-zinc-800 p-6 text-center">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-sm text-gray-400">
        © {new Date().getFullYear()} CabanaPWA · Todos los derechos reservados
      </footer>
    </div>
  );
}
