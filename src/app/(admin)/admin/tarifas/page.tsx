"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Tarifa {
  id: string;
  cabana_id: string;
  cabana_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_por_noche: number;
  tipo: string;
  descripcion: string;
}

interface Cabana {
  id: string;
  nombre: string;
}

export default function AdminTarifas() {
  const { accessToken } = useAuth();
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [cabanas, setCabanas] = useState<Cabana[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cabana_id: "", fecha_inicio: "", fecha_fin: "",
    precio_por_noche: 0, tipo: "temporada_alta", descripcion: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      fetch("/api/tarifas", { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
      fetch("/api/cabanas").then(r => r.json()),
    ]).then(([t, c]) => {
      if (t.success) setTarifas(t.data);
      if (c.success) setCabanas(c.data);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tarifas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ...form, precio_por_noche: Number(form.precio_por_noche) }),
      });
      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        // Refresh
        const t = await fetch("/api/tarifas", { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json());
        if (t.success) setTarifas(t.data);
      } else {
        setError(json.error);
      }
    } catch {
      setError("Error al crear");
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tarifas/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
    setTarifas(prev => prev.filter(t => t.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tarifas Variables</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancelar" : "+ Nueva Tarifa"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700 space-y-4">
          {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Cabaña</label>
            <select value={form.cabana_id} onChange={update("cabana_id")} className="input-field" required>
              <option value="">Seleccionar...</option>
              {cabanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Fecha Inicio</label><input type="date" value={form.fecha_inicio} onChange={update("fecha_inicio")} className="input-field" required /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Fin</label><input type="date" value={form.fecha_fin} onChange={update("fecha_fin")} className="input-field" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Precio por Noche ($)</label><input type="number" value={form.precio_por_noche} onChange={update("precio_por_noche")} className="input-field" min={0} required /></div>
            <div><label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={form.tipo} onChange={update("tipo")} className="input-field">
                <option value="temporada_alta">Temporada Alta</option>
                <option value="temporada_baja">Temporada Baja</option>
                <option value="especial">Especial</option>
                <option value="feriado">Feriado</option>
                <option value="finde">Fin de Semana</option>
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Descripción</label><input value={form.descripcion} onChange={update("descripcion")} className="input-field" /></div>
          <button type="submit" className="btn-primary w-full">Crear Tarifa</button>
        </form>
      )}

      <div className="space-y-3">
        {tarifas.map((t) => (
          <div key={t.id} className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{t.cabana_nombre}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{t.tipo.replace(/_/g, " ")}</span>
              </div>
              <p className="text-sm text-gray-500">
                {t.fecha_inicio} → {t.fecha_fin} · <span className="font-semibold text-primary">${t.precio_por_noche}/noche</span>
              </p>
            </div>
            <button onClick={() => handleDelete(t.id)} className="text-danger text-sm hover:underline">Eliminar</button>
          </div>
        ))}
        {tarifas.length === 0 && <p className="text-center text-gray-500 py-10">No hay tarifas configuradas</p>}
      </div>
    </div>
  );
}
