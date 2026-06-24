"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuditoriaPage() {
  const { accessToken } = useAuth();
  const [registros, setRegistros] = useState<{
    id: string; usuario_id: string; accion: string; ip: string;
    tabla_afectada: string; registro_id: string; datos_antes: string | null;
    datos_despues: string | null; created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/auditoria", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setRegistros(d.data); })
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🔍 Auditoría del Sistema</h1>
      <p className="text-sm text-gray-500">Registro de todas las acciones críticas realizadas en la plataforma</p>

      <div className="space-y-2">
        {registros.map((r) => (
          <div key={r.id} className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 text-sm">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <div>
                <span className="font-semibold capitalize">{r.accion.replace(/_/g, " ")}</span>
                <span className="text-gray-500 ml-2">en {r.tabla_afectada}#{r.registro_id.slice(0, 8)}</span>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(r.created_at).toLocaleString("es-AR")} · IP: {r.ip} · Usuario: {r.usuario_id.slice(0, 8)}
              </div>
            </div>
            {r.datos_despues && (
              <details className="mt-2">
                <summary className="text-primary cursor-pointer text-xs">Ver datos</summary>
                <pre className="mt-1 text-xs bg-gray-50 dark:bg-zinc-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(JSON.parse(r.datos_despues), null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        {registros.length === 0 && (
          <p className="text-center text-gray-500 py-20">No hay registros de auditoría aún</p>
        )}
      </div>
    </div>
  );
}
