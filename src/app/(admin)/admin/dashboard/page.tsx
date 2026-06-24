"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { DashboardStats } from "@/types";

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/dashboard", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); });
  }, [accessToken]);

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const cards = [
    { label: "Usuarios Activos", value: stats.total_usuarios_activos, icon: "👥", color: "from-blue-500 to-indigo-600" },
    { label: "Saldo en Sistema", value: `$${stats.saldo_total_sistema.toLocaleString()}`, icon: "💰", color: "from-green-500 to-emerald-600" },
    { label: "Pendiente Aprobación", value: `$${stats.saldo_pendiente_aprobacion.toLocaleString()}`, icon: "⏳", color: "from-yellow-500 to-orange-500" },
    { label: "Ingresos del Mes", value: `$${stats.ingresos_mes.toLocaleString()}`, icon: "📈", color: "from-purple-500 to-pink-500" },
    { label: "Ingresos del Año", value: `$${stats.ingresos_anio.toLocaleString()}`, icon: "💵", color: "from-teal-500 to-cyan-600" },
    { label: "Reservas Activas", value: stats.reservas_activas, icon: "📅", color: "from-red-500 to-pink-500" },
    { label: "Ocupación", value: `${stats.ocupacion_promedio}%`, icon: "🏠", color: "from-indigo-500 to-purple-600" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`card bg-gradient-to-br ${c.color} text-white p-5 rounded-xl`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs opacity-80 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/admin/saldo", icon: "💳", label: "Validar Solicitudes de Saldo", desc: "Aprobar o rechazar cargas pendientes" },
          { href: "/admin/usuarios", icon: "👥", label: "Gestionar Usuarios", desc: "Buscar, bloquear, ver estados financieros" },
          { href: "/admin/cabanas", icon: "🏡", label: "Gestionar Cabañas", desc: "CRUD completo, imágenes, precios" },
          { href: "/admin/tarifas", icon: "💲", label: "Tarifas Variables", desc: "Precios por temporada y fechas especiales" },
          { href: "/admin/auditoria", icon: "🔍", label: "Auditoría", desc: "Registro de todas las acciones críticas" },
        ].map((link) => (
          <a key={link.href} href={link.href} className="card bg-white dark:bg-zinc-800 rounded-xl p-5 border border-gray-200 dark:border-zinc-700">
            <div className="text-3xl mb-2">{link.icon}</div>
            <h3 className="font-bold">{link.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
