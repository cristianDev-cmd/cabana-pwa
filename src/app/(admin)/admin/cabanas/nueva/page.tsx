"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function NuevaCabanaPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "", descripcion: "", capacidad: 2, ubicacion: "",
    latitud: "", longitud: "", servicios: "", precio_base_por_noche: 0,
    estado: "activa",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = {
        ...form,
        capacidad: Number(form.capacidad),
        precio_base_por_noche: Number(form.precio_base_por_noche),
        latitud: form.latitud ? Number(form.latitud) : null,
        longitud: form.longitud ? Number(form.longitud) : null,
        servicios: form.servicios.split(",").map(s => s.trim()).filter(Boolean),
      };

      const res = await fetch("/api/cabanas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/admin/cabanas");
      } else {
        setError(json.error ?? "Error al crear");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nueva Cabaña</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700 space-y-4">
        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>}

        <div><label className="block text-sm font-medium mb-1">Nombre</label><input type="text" value={form.nombre} onChange={update("nombre")} className="input-field" required /></div>
        <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea value={form.descripcion} onChange={update("descripcion")} className="input-field" rows={3} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">Capacidad</label><input type="number" value={form.capacidad} onChange={update("capacidad")} className="input-field" min={1} required /></div>
          <div><label className="block text-sm font-medium mb-1">Precio Base/Noche ($)</label><input type="number" value={form.precio_base_por_noche} onChange={update("precio_base_por_noche")} className="input-field" min={0} required /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Ubicación</label><input type="text" value={form.ubicacion} onChange={update("ubicacion")} className="input-field" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">Latitud</label><input type="number" step="any" value={form.latitud} onChange={update("latitud")} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Longitud</label><input type="number" step="any" value={form.longitud} onChange={update("longitud")} className="input-field" /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Servicios (separados por coma)</label><input type="text" value={form.servicios} onChange={update("servicios")} className="input-field" placeholder="WiFi, Pileta, Parrilla, Aire Acond." /></div>
        <div><label className="block text-sm font-medium mb-1">Estado</label>
          <select value={form.estado} onChange={update("estado")} className="input-field">
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creando..." : "Crear Cabaña"}
        </button>
      </form>
    </div>
  );
}
