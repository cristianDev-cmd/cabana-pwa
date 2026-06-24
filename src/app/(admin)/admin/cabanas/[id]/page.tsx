"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function EditarCabanaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetch(`/api/cabanas/${id}`).then(r => r.json()).then(d => {
      if (d.success) {
        const c = d.data;
        setForm({
          nombre: c.nombre, descripcion: c.descripcion, capacidad: c.capacidad,
          ubicacion: c.ubicacion, latitud: c.latitud ?? "", longitud: c.longitud ?? "",
          servicios: (JSON.parse(c.servicios ?? "[]") as string[]).join(", "),
          precio_base_por_noche: c.precio_base_por_noche, estado: c.estado,
        });
      }
    }).finally(() => setLoading(false));
  }, [id, accessToken]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const body = {
        ...form,
        capacidad: Number(form.capacidad),
        precio_base_por_noche: Number(form.precio_base_por_noche),
        latitud: form.latitud ? Number(form.latitud) : null,
        longitud: form.longitud ? Number(form.longitud) : null,
        servicios: String(form.servicios ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
      };

      const res = await fetch(`/api/cabanas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      if ((await res.json()).success) router.push("/admin/cabanas");
      else setError("Error al guardar");
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Editar Cabaña</h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700 space-y-4">
        {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>}
        <div><label className="block text-sm font-medium mb-1">Nombre</label><input value={form.nombre as string} onChange={update("nombre")} className="input-field" required /></div>
        <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea value={form.descripcion as string} onChange={update("descripcion")} className="input-field" rows={3} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">Capacidad</label><input type="number" value={form.capacidad as number} onChange={update("capacidad")} className="input-field" min={1} /></div>
          <div><label className="block text-sm font-medium mb-1">Precio Base/Noche ($)</label><input type="number" value={form.precio_base_por_noche as number} onChange={update("precio_base_por_noche")} className="input-field" min={0} /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Ubicación</label><input value={form.ubicacion as string} onChange={update("ubicacion")} className="input-field" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">Latitud</label><input type="number" step="any" value={form.latitud as string} onChange={update("latitud")} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Longitud</label><input type="number" step="any" value={form.longitud as string} onChange={update("longitud")} className="input-field" /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Servicios</label><input value={form.servicios as string} onChange={update("servicios")} className="input-field" /></div>
        <div><label className="block text-sm font-medium mb-1">Estado</label>
          <select value={form.estado as string} onChange={update("estado")} className="input-field">
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Guardando..." : "Guardar Cambios"}</button>
      </form>
    </div>
  );
}
