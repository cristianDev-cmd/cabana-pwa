"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Cabana {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  precio_base_por_noche: number;
  estado: string;
}

export default function AdminCabanas() {
  const { accessToken } = useAuth();
  const [cabanas, setCabanas] = useState<Cabana[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/cabanas").then(r => r.json()).then(d => {
      if (d.success) setCabanas(d.data);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Cabañas</h1>
        <Link href="/admin/cabanas/nueva" className="btn-primary">+ Nueva Cabaña</Link>
      </div>

      <div className="grid gap-3">
        {cabanas.map((c) => (
          <div key={c.id} className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{c.nombre}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.estado === "activa" ? "bg-success/10 text-success" : 
                  c.estado === "mantenimiento" ? "bg-warning/10 text-warning" : 
                  "bg-danger/10 text-danger"
                }`}>
                  {c.estado}
                </span>
              </div>
              <p className="text-sm text-gray-500">📍 {c.ubicacion} · 👥 {c.capacidad} pers. · 💰 ${c.precio_base_por_noche}/noche</p>
            </div>
            <Link href={`/admin/cabanas/${c.id}`} className="text-primary text-sm font-semibold hover:underline">
              Editar →
            </Link>
          </div>
        ))}
        {cabanas.length === 0 && <p className="text-center text-gray-500 py-10">No hay cabañas aún</p>}
      </div>
    </div>
  );
}
