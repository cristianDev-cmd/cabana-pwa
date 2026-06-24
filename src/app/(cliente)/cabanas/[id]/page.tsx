"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface CabanaDetail {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  servicios: string;
  precio_base_por_noche: number;
  estado: string;
  imagenes: { url: string; es_principal: number }[];
  tarifas: { fecha_inicio: string; fecha_fin: string; precio_por_noche: number; tipo: string }[];
}

interface Cotizacion {
  precios: { fecha: string; precio: number }[];
  noches: number;
  total: number;
}

export default function CabanaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const router = useRouter();

  const [cabana, setCabana] = useState<CabanaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [mainImageIdx, setMainImageIdx] = useState(0);

  useEffect(() => {
    async function loadCabana() {
      try {
        const res = await fetch(`/api/cabanas/${id}`);
        const json = await res.json();
        if (json.success) setCabana(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCabana();
  }, [id]);

  const handleCotizar = async () => {
    if (!checkin || !checkout) return;
    setError("");
    try {
      const res = await fetch(`/api/cabanas/${id}/disponibilidad?desde=${checkin}&hasta=${checkout}`);
      const json = await res.json();
      if (json.success) {
        if (!json.data.disponible) {
          setError(json.data.conflicto ?? "No disponible");
          setCotizacion(null);
        } else {
          setCotizacion(json.data);
        }
      } else {
        setError(json.error);
      }
    } catch {
      setError("Error al cotizar");
    }
  };

  const handleReservar = async () => {
    if (!cotizacion) return;
    setBooking(true);
    setError("");
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ cabana_id: id, fecha_checkin: checkin, fecha_checkout: checkout }),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/reservas");
      } else {
        setError(json.error);
      }
    } catch {
      setError("Error al reservar");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cabana) {
    return <div className="text-center py-20 text-gray-500">Cabaña no encontrada</div>;
  }

  const servicios = JSON.parse(cabana.servicios ?? "[]") as string[];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Gallery */}
      <div className="relative aspect-[16/9] bg-gray-200 dark:bg-zinc-700 rounded-xl overflow-hidden mb-6">
        {cabana.imagenes?.length > 0 ? (
          <img
            src={cabana.imagenes[mainImageIdx]?.url ?? ""}
            alt={cabana.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🏡</div>
        )}
        {cabana.imagenes?.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {cabana.imagenes.map((_, i) => (
              <button
                key={i}
                onClick={() => setMainImageIdx(i)}
                className={`w-2 h-2 rounded-full ${i === mainImageIdx ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{cabana.nombre}</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">📍 {cabana.ubicacion}</p>
          </div>

          <div className="flex gap-6 text-sm">
            <span>👥 Hasta {cabana.capacidad} personas</span>
            <span>💰 Desde ${cabana.precio_base_por_noche}/noche</span>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-2">Descripción</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{cabana.descripcion}</p>
          </div>

          {servicios.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3">Servicios</h2>
              <div className="flex flex-wrap gap-2">
                {servicios.map((s, i) => (
                  <span key={i} className="px-4 py-2 bg-primary/5 text-primary rounded-full text-sm font-medium">
                    ✨ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cabana.tarifas?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3">Tarifas Especiales</h2>
              <div className="space-y-2">
                {cabana.tarifas.map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    <div>
                      <span className="text-sm font-medium capitalize">
                        {t.tipo.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {t.fecha_inicio} → {t.fecha_fin}
                      </span>
                    </div>
                    <span className="font-bold text-primary">${t.precio_por_noche}/noche</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-zinc-700 space-y-4">
            <div className="text-center">
              <span className="text-2xl font-bold">${cabana.precio_base_por_noche}</span>
              <span className="text-gray-500"> / noche</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Check-in</label>
              <input
                type="date"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-out</label>
              <input
                type="date"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                className="input-field"
                min={checkin || new Date().toISOString().split("T")[0]}
              />
            </div>

            <button onClick={handleCotizar} className="btn-secondary w-full">
              Cotizar 💰
            </button>

            {error && (
              <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>
            )}

            {cotizacion && (
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-zinc-700 animate-slide-up">
                <div className="flex justify-between text-sm">
                  <span>{cotizacion.noches} noche{cotizacion.noches > 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {cotizacion.precios.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-500">
                      <span>{p.fecha}</span>
                      <span>${p.precio}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-zinc-700">
                  <span>Total</span>
                  <span>${cotizacion.total.toLocaleString()}</span>
                </div>
                <button
                  onClick={handleReservar}
                  disabled={booking}
                  className="btn-primary w-full"
                >
                  {booking ? "Reservando..." : "Confirmar Reserva 🔒"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
