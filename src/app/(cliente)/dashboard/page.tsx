"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ClienteDashboard() {
  const { user, accessToken } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [reservas, setReservas] = useState<{ total: number }>({ total: 0 });

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/saldo/movimientos", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setSaldo(d.data.saldo_actual); });

    fetch("/api/reservas?estado=confirmada", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setReservas({ total: d.data.length }); });
  }, [accessToken]);

  const cards = [
    { label: "Saldo disponible", value: `$${saldo.toLocaleString()}`, icon: "💰", href: "/saldo", color: "from-green-500 to-emerald-600" },
    { label: "Reservas activas", value: `${reservas.total}`, icon: "📅", href: "/reservas", color: "from-blue-500 to-indigo-600" },
    { label: "Cabañas", value: "Explorar", icon: "🏡", href: "/cabanas", color: "from-orange-500 to-red-500" },
    { label: "Perfil", value: user?.nombre ?? "", icon: "👤", href: "/perfil", color: "from-purple-500 to-pink-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hola, {user?.nombre} 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenido a tu panel</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`card relative overflow-hidden bg-gradient-to-br ${card.color} text-white p-4 sm:p-6 rounded-xl`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-sm opacity-90">{card.label}</div>
            <div className="font-bold text-lg mt-1">{card.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link href="/saldo" className="card bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
          <h3 className="font-bold text-lg">💳 Cargar Saldo</h3>
          <p className="text-sm text-gray-500 mt-1">Realizá una transferencia y cargá saldo a tu cuenta</p>
          <span className="text-primary text-sm font-semibold mt-3 inline-block">Cargar ahora →</span>
        </Link>
        <Link href="/cabanas" className="card bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
          <h3 className="font-bold text-lg">🏡 Nueva Reserva</h3>
          <p className="text-sm text-gray-500 mt-1">Explorá cabañas disponibles y hacé tu reserva</p>
          <span className="text-primary text-sm font-semibold mt-3 inline-block">Explorar →</span>
        </Link>
      </div>
    </div>
  );
}
