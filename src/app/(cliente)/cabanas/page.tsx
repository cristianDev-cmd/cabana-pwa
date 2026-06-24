"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Cabana {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  ubicacion: string;
  precio_base_por_noche: number;
  estado: string;
  servicios: string;
  imagenes: { url: string; es_principal: number }[];
}

export default function CabanasPage() {
  const { accessToken } = useAuth();
  const [cabanas, setCabanas] = useState<Cabana[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCabanas() {
      try {
        const res = await fetch("/api/cabanas");
        const json = await res.json();
        if (json.success) setCabanas(json.data.filter((c: Cabana) => c.estado === "activa"));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCabanas();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explorá nuestras cabañas</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {cabanas.length} cabaña{cabanas.length !== 1 ? "s" : ""} disponible{cabanas.length !== 1 ? "s" : ""}
        </p>
      </div>

      {cabanas.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🏡</p>
          <p className="text-lg">No hay cabañas disponibles por el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cabanas.map((cabana) => {
            const mainImg = cabana.imagenes?.find((i) => i.es_principal);
            const servicios = JSON.parse(cabana.servicios ?? "[]") as string[];

            return (
              <Link
                key={cabana.id}
                href={`/cabanas/${cabana.id}`}
                className="card bg-white dark:bg-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="aspect-[4/3] bg-gray-200 dark:bg-zinc-700 relative">
                  {mainImg ? (
                    <img src={mainImg.url} alt={cabana.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🏡</div>
                  )}
                  <div className="absolute top-3 right-3 bg-white dark:bg-zinc-800 px-2 py-1 rounded-lg text-sm font-bold shadow">
                    ${cabana.precio_base_por_noche}/noche
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">{cabana.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {cabana.ubicacion}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    👥 Hasta {cabana.capacidad} personas
                  </p>
                  {servicios.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {servicios.slice(0, 4).map((s, i) => (
                        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
