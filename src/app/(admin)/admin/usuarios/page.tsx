"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Usuario {
  id: string;
  dni: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  role: string;
  estado: string;
  saldo: number;
  created_at: string;
}

export default function AdminUsuarios() {
  const { accessToken } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = (q = "") => {
    setLoading(true);
    fetch(`/api/admin/usuarios?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setUsuarios(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsuarios(); }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBlock = async (id: string, accion: "bloquear" | "desbloquear") => {
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ usuarioId: id, accion }),
    });
    fetchUsuarios(query);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>

      <div className="flex gap-3">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, email, DNI..."
          className="input-field flex-1"
          onKeyDown={e => e.key === "Enter" && fetchUsuarios(query)}
        />
        <button onClick={() => fetchUsuarios(query)} className="btn-primary">Buscar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid gap-3">
          {usuarios.map((u) => (
            <div key={u.id} className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{u.nombre} {u.apellido}</span>
                  {u.role === "admin" && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.estado === "activo" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {u.estado}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{u.email} · DNI: {u.dni} · Tel: {u.telefono}</p>
                <p className="text-sm text-gray-500">
                  Saldo: <span className="font-semibold">${u.saldo.toLocaleString()}</span> · 
                  Desde: {new Date(u.created_at).toLocaleDateString("es-AR")}
                </p>
              </div>
              <button
                onClick={() => toggleBlock(u.id, u.estado === "activo" ? "bloquear" : "desbloquear")}
                className={`text-sm font-semibold px-4 py-2 rounded-lg ${
                  u.estado === "activo" ? "text-danger border border-danger hover:bg-danger/5" : "text-success border border-success hover:bg-success/5"
                }`}
              >
                {u.estado === "activo" ? "🔒 Bloquear" : "🔓 Desbloquear"}
              </button>
            </div>
          ))}
          {usuarios.length === 0 && (
            <p className="text-center text-gray-500 py-10">No se encontraron usuarios</p>
          )}
        </div>
      )}
    </div>
  );
}
