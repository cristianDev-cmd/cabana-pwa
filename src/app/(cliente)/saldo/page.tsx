"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface DatosBancarios {
  banco: string;
  titular: string;
  cbu_cvu: string;
  alias: string;
  cuit: string;
}

export default function SaldoPage() {
  const { accessToken } = useAuth();
  const [saldo, setSaldo] = useState(0);
  const [movimientos, setMovimientos] = useState<{ tipo: string; monto_movimiento: number; saldo_posterior: number; created_at: string }[]>([]);
  const [datosBanco, setDatosBanco] = useState<DatosBancarios | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [monto, setMonto] = useState("");
  const [bancoOrigen, setBancoOrigen] = useState("");
  const [referencia, setReferencia] = useState("");
  const [fecha, setFecha] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/saldo/movimientos", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setSaldo(d.data.saldo_actual);
          setMovimientos(d.data.movimientos ?? []);
        }
      });
    fetch("/api/config/datos-bancarios")
      .then(r => r.json())
      .then(d => { if (d.success) setDatosBanco(d.data); });
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const formData = new FormData();
    formData.append("monto", monto);
    formData.append("banco_origen", bancoOrigen);
    formData.append("referencia_transferencia", referencia);
    formData.append("fecha_transferencia", fecha);

    try {
      const res = await fetch("/api/saldo/solicitar", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setMensaje("✅ Solicitud enviada. El administrador validará tu transferencia.");
        setShowForm(false);
        setMonto(""); setBancoOrigen(""); setReferencia(""); setFecha("");
      } else {
        setError(json.error);
      }
    } catch {
      setError("Error al enviar solicitud");
    }
  };

  const generarTextoWhatsApp = () => {
    if (!datosBanco) return "";
    return `Hola! 👋 Acabo de realizar una transferencia por $${monto} desde ${bancoOrigen}. *Referencia: ${referencia}* - Fecha: ${fecha}. Adjunto comprobante. ¡Gracias!`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mi Saldo</h1>

        <div className="mt-4 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-6">
          <p className="text-sm opacity-80">Saldo disponible</p>
          <p className="text-4xl font-bold mt-1">${saldo.toLocaleString()}</p>
        </div>
      </div>

      {/* Datos Bancarios */}
      {datosBanco && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
          <h2 className="font-bold text-lg mb-3">🏦 Datos para Transferencia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Banco:</span> {datosBanco.banco}</div>
            <div><span className="text-gray-500">Titular:</span> {datosBanco.titular}</div>
            <div><span className="text-gray-500">CBU/CVU:</span> <code className="bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded">{datosBanco.cbu_cvu}</code></div>
            <div><span className="text-gray-500">Alias:</span> {datosBanco.alias}</div>
            <div><span className="text-gray-500">CUIT:</span> {datosBanco.cuit}</div>
          </div>
        </div>
      )}

      {/* Form */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="btn-primary w-full">
          💳 Solicitar Carga de Saldo
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700 space-y-4">
          <h2 className="font-bold text-lg">Solicitar Carga</h2>

          {error && <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>}
          {mensaje && <div className="bg-success/10 text-success text-sm p-3 rounded-lg">{mensaje}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Monto ($)</label>
            <input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="input-field" required min="1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Banco de Origen</label>
            <input type="text" value={bancoOrigen} onChange={e => setBancoOrigen(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Referencia / N° Operación</label>
            <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Transferencia</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comprobante (JPG/PNG/PDF)</label>
            <input type="file" accept="image/jpeg,image/png,application/pdf" className="input-field" />
          </div>

          {monto && referencia && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">📱 Texto para WhatsApp:</p>
              <p className="text-gray-700 dark:text-gray-300">{generarTextoWhatsApp()}</p>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(generarTextoWhatsApp())}
                className="mt-2 text-primary text-xs font-semibold"
              >
                Copiar texto 📋
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">Enviar Solicitud</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {/* Movimientos */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700">
        <h2 className="font-bold text-lg mb-4">📋 Historial de Movimientos</h2>
        {movimientos.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">Sin movimientos aún</p>
        ) : (
          <div className="space-y-2">
            {movimientos.slice(0, 10).map((m, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-700 last:border-0">
                <div>
                  <span className="text-sm font-medium capitalize">{m.tipo.replace(/_/g, " ")}</span>
                  <span className="text-xs text-gray-500 block">{new Date(m.created_at).toLocaleDateString("es-AR")}</span>
                </div>
                <span className={`font-semibold ${m.monto_movimiento > 0 ? "text-success" : "text-danger"}`}>
                  {m.monto_movimiento > 0 ? "+" : ""}${Math.abs(m.monto_movimiento).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
