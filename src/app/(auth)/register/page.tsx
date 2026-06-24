"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { register, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    dni: "", email: "", password: "", nombre: "", apellido: "", telefono: "", direccion: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      // Auto-login after register
      await login(form.email, form.password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "DNI", key: "dni", type: "text", placeholder: "12345678", autoComplete: "off" },
    { label: "Email", key: "email", type: "email", placeholder: "tu@email.com", autoComplete: "email" },
    { label: "Contraseña", key: "password", type: "password", placeholder: "Mín. 8 caracteres", autoComplete: "new-password" },
    { label: "Nombre", key: "nombre", type: "text", placeholder: "Tu nombre", autoComplete: "given-name" },
    { label: "Apellido", key: "apellido", type: "text", placeholder: "Tu apellido", autoComplete: "family-name" },
    { label: "Teléfono", key: "telefono", type: "tel", placeholder: "+54 11 1234-5678", autoComplete: "tel" },
    { label: "Dirección", key: "direccion", type: "text", placeholder: "Tu dirección", autoComplete: "street-address" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50 dark:bg-zinc-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl">🏡</Link>
          <h1 className="text-2xl font-bold mt-3">Crear Cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Unite a CabanaPWA</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>
          )}

          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={(form as Record<string, string>)[f.key]}
                onChange={update(f.key)}
                className="input-field"
                placeholder={f.placeholder}
                required
                autoComplete={f.autoComplete}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
