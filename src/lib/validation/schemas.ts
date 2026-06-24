import { z } from "zod";

// ============================================================
// Auth Schemas
// ============================================================
export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña mínima 6 caracteres"),
});

export const RegisterSchema = z.object({
  dni: z.string()
    .min(7, "DNI inválido")
    .max(9, "DNI inválido")
    .regex(/^\d+$/, "DNI debe contener solo números"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Contraseña mínima 8 caracteres")
    .regex(/[A-Z]/, "Debe contener mayúscula")
    .regex(/[0-9]/, "Debe contener número"),
  nombre: z.string().min(2, "Nombre muy corto").max(100),
  apellido: z.string().min(2, "Apellido muy corto").max(100),
  telefono: z.string().min(8).max(20),
  direccion: z.string().min(5).max(200),
});

export const UpdateProfileSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  apellido: z.string().min(2).max(100).optional(),
  telefono: z.string().min(8).max(20).optional(),
  direccion: z.string().min(5).max(200).optional(),
});

// ============================================================
// Cabana Schemas
// ============================================================
export const CabanaSchema = z.object({
  nombre: z.string().min(3, "Nombre mínimo 3 caracteres").max(150),
  descripcion: z.string().min(10, "Descripción muy corta").max(2000),
  capacidad: z.number().int().min(1).max(50),
  ubicacion: z.string().min(3).max(300),
  latitud: z.number().min(-90).max(90).nullable().optional(),
  longitud: z.number().min(-180).max(180).nullable().optional(),
  servicios: z.array(z.string()).default([]),
  precio_base_por_noche: z.number().positive("Precio debe ser positivo"),
  estado: z.enum(["activa", "inactiva", "mantenimiento"]).default("activa"),
});

export const CabanaUpdateSchema = CabanaSchema.partial();

// ============================================================
// Tarifa Schemas
// ============================================================
export const TarifaSchema = z.object({
  cabana_id: z.string().uuid(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  precio_por_noche: z.number().positive(),
  tipo: z.enum(["temporada_alta", "temporada_baja", "especial", "feriado", "finde"]),
  descripcion: z.string().min(3).max(300),
}).refine((data) => data.fecha_fin >= data.fecha_inicio, {
  message: "fecha_fin debe ser posterior a fecha_inicio",
});

// ============================================================
// Solicitud de Saldo
// ============================================================
export const SolicitudSaldoSchema = z.object({
  monto: z.number().positive("Monto debe ser positivo").max(999999, "Monto máximo excedido"),
  banco_origen: z.string().min(2).max(100),
  referencia_transferencia: z.string().min(4).max(200),
  fecha_transferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const ResolucionSolicitudSchema = z.object({
  solicitud_id: z.string().uuid(),
  aprobado: z.boolean(),
  motivo_rechazo: z.string().max(500).optional(),
});

// ============================================================
// Reserva Schemas
// ============================================================
export const ReservaSchema = z.object({
  cabana_id: z.string().uuid(),
  fecha_checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine((data) => data.fecha_checkout > data.fecha_checkin, {
  message: "Check-out debe ser posterior al check-in",
});

export const CancelacionReservaSchema = z.object({
  reserva_id: z.string().uuid(),
  motivo: z.string().min(3).max(500).optional(),
});

// ============================================================
// File Upload
// ============================================================
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg", "image/png", "image/webp", "application/pdf"
] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ============================================================
// Query Schemas
// ============================================================
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const DisponibilidadSchema = z.object({
  cabana_id: z.string().uuid().optional(),
  fecha_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});