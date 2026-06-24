"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Reserva {
  id: string;
  cabana_nombre: string;
  cabana_ubicacion: string;
  fecha_checkin: string;
  fecha_checkout: string;
  noches: number;
  monto_total: number;
  estado: string;
  cancelada_en: string | null;
  devolucion_monto: number | null;
}

export default function ReservasPage() {
  const { accessToken } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelMsg, setCancelMsg] = useState("");

  const fetchReservas = () => {
    if (!accessToken) return;
    fetch("/api/reservas", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setReservas(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReservas(); }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/reservas/${id}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success) {
        setCancelMsg(`Cancelada: devolución $${json.data.devolucion} (${json.data.porcentaje}%)`);
        fetchReservas();
      }
    } catch {
      setCancelMsg("Error al cancelar");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const estadoColor: Record<string, string> = {
    confirmada: "bg-success/10 text-success",
    cancelada: "bg-danger/10 text-danger",
    completada: "bg-gray-200 dark:bg-zinc-700 text-gray-500",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mis Reservas</h1>

      {cancelMsg && <div className="bg-warning/10 text-warning text-sm p-3 rounded-lg">{cancelMsg}</div>}

      {reservas.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-lg">No tenés reservas aún</p>
          <a href="/cabanas" className="text-primary font-semibold mt-2 inline-block">Explorar cabañas →</a>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map((r) => (
            <div key={r.id} className="card bg-white dark:bg-zinc-800 rounded-xl p-5 border border-gray-200 dark:border-zinc-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{r.cabana_nombre}</h3>
                  <p className="text-sm text-gray-500">{r.cabana_ubicacion}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${estadoColor[r.estado] ?? ""}`}>
                  {r.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                <div><span className="text-gray-500">Check-in</span><br />{new Date(r.fecha_checkin).toLocaleDateString("es-AR")}</div>
                <div><span className="text-gray-500">Check-out</span><br />{new Date(r.fecha_checkout).toLocaleDateString("es-AR")}</div>
                <div><span className="text-gray-500">Noches</span><br />{r.noches}</div>
                <div><span className="text-gray-500">Total</span><br /><span className="font-bold">${r.monto_total.toLocaleString()}</span></div>
              </div>

              {r.estado === "confirmada" && (
                <button onClick={() => handleCancel(r.id)} className="mt-4 text-danger text-sm font-semibold hover:underline">
                  Cancelar reserva
                </button>
              )}

              {r.estado === "cancelada" && r.devolucion_monto != null && (
                <p className="mt-3 text-sm text-success">💰 Devolución: ${r.devolucion_monto.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
