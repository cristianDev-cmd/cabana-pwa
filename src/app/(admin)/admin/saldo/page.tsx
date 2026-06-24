"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Solicitud {
  id: string;
  usuario_id: string;
  nombre: string;
  apellido: string;
  email: string;
  monto: number;
  banco_origen: string;
  referencia_transferencia: string;
  fecha_transferencia: string;
  comprobante_url: string;
  estado: string;
  created_at: string;
}

export default function ValidarSaldoPage() {
  const { accessToken } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const fetchSolicitudes = () => {
    fetch("/api/admin/saldo?estado=pendiente", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => { if (d.success) setSolicitudes(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (accessToken) fetchSolicitudes(); }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (id: string, aprobado: boolean, motivo?: string) => {
    try {
      const res = await fetch("/api/admin/saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ solicitud_id: id, aprobado, motivo_rechazo: motivo }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(aprobado ? `✅ Solicitud aprobada` : `❌ Solicitud rechazada`);
        fetchSolicitudes();
      } else {
        setMsg(`Error: ${json.error}`);
      }
    } catch {
      setMsg("Error al procesar");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Validar Solicitudes de Saldo</h1>

      {msg && <div className="bg-warning/10 text-warning text-sm p-3 rounded-lg">{msg}</div>}

      {solicitudes.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">✅</p>
          <p>No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((s) => (
            <div key={s.id} className="bg-white dark:bg-zinc-800 rounded-xl p-5 border border-gray-200 dark:border-zinc-700">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{s.nombre} {s.apellido}</span>
                    <span className="text-xs text-gray-500">{s.email}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div><span className="text-gray-500">Monto:</span> <span className="font-bold text-lg text-primary">${s.monto.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Banco:</span> {s.banco_origen}</div>
                    <div><span className="text-gray-500">Referencia:</span> {s.referencia_transferencia}</div>
                    <div><span className="text-gray-500">Fecha:</span> {new Date(s.fecha_transferencia).toLocaleDateString("es-AR")}</div>
                    <div><span className="text-gray-500">Solicitado:</span> {new Date(s.created_at).toLocaleString("es-AR")}</div>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 justify-center">
                  <button onClick={() => handleAction(s.id, true)} className="btn-primary text-sm px-4 py-2">
                    ✅ Aprobar
                  </button>
                  <button
                    onClick={() => {
                      const motivo = prompt("Motivo del rechazo:");
                      if (motivo) handleAction(s.id, false, motivo);
                    }}
                    className="btn-secondary text-sm px-4 py-2 text-danger border-danger"
                  >
                    ❌ Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
