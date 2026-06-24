"use client";

import { useAuth } from "@/context/AuthContext";

export default function PerfilPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-gray-200 dark:border-zinc-700 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {user.nombre[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-lg">{user.nombre} {user.apellido}</h2>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">{user.role}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div><span className="text-gray-500">DNI:</span> {user.dni}</div>
          <div><span className="text-gray-500">Email:</span> {user.email}</div>
          <div><span className="text-gray-500">Teléfono:</span> {user.telefono}</div>
        </div>
      </div>

      <button onClick={logout} className="btn-secondary w-full text-danger border-danger hover:bg-danger/5">
        🚪 Cerrar Sesión
      </button>
    </div>
  );
}
