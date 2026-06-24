// ============================================================
// CabanaPWA - Core Type Definitions
// ============================================================

// ---- User & Auth ----
export type UserRole = "cliente" | "admin";

export interface User {
  id: string;                // UUID
  dni: string;               // Unique
  email: string;             // Unique
  password_hash: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  avatar_url: string | null;
  role: UserRole;
  estado: "activo" | "bloqueado";
  created_at: string;
  updated_at: string;
}

// ---- Cabañas ----
export interface Cabana {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
  servicios: string;          // JSON array
  precio_base_por_noche: number; // Immutable base, overridden by tarifas
  estado: "activa" | "inactiva" | "mantenimiento";
  created_at: string;
  updated_at: string;
}

export interface CabanaImagen {
  id: string;
  cabana_id: string;
  url: string;               // R2 URL
  es_principal: boolean;
  orden: number;
  created_at: string;
}

// ---- Tarifas (Variable Pricing) ----
export interface Tarifa {
  id: string;
  cabana_id: string;
  fecha_inicio: string;      // ISO date
  fecha_fin: string;         // ISO date
  precio_por_noche: number;
  tipo: "temporada_alta" | "temporada_baja" | "especial" | "feriado" | "finde";
  descripcion: string;
  created_at: string;
}

// ---- Contabilidad: Movimiento Inmutable ----
export type TipoMovimiento =
  | "carga_aprobada"
  | "reserva_realizada"
  | "devolucion_cancelacion"
  | "ajuste_administrativo";

export interface Movimiento {
  id: string;
  usuario_id: string;
  tipo: TipoMovimiento;
  saldo_anterior: number;
  monto_movimiento: number;
  saldo_posterior: number;
  referencia_tabla: string;   // e.g., "solicitudes_saldo", "reservas"
  referencia_id: string;      // FK to the source record
  admin_id: string | null;    // For adjustments
  created_at: string;
}

// ---- Solicitudes de Saldo ----
export interface SolicitudSaldo {
  id: string;
  usuario_id: string;
  monto: number;
  banco_origen: string;
  referencia_transferencia: string;
  fecha_transferencia: string;
  comprobante_url: string;     // R2 URL
  estado: "pendiente" | "aprobada" | "rechazada";
  admin_id: string | null;
  motivo_rechazo: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Reservas ----
export type EstadoReserva = "confirmada" | "cancelada" | "completada";

export interface Reserva {
  id: string;
  usuario_id: string;
  cabana_id: string;
  fecha_checkin: string;
  fecha_checkout: string;
  noches: number;
  precio_por_noche: number;  // Snapshot at booking time
  monto_total: number;
  estado: EstadoReserva;
  cancelada_en: string | null;
  motivo_cancelacion: string | null;
  devolucion_monto: number | null;
  created_at: string;
  updated_at: string;
}

// ---- Auditoría ----
export interface Auditoria {
  id: string;
  usuario_id: string;
  accion: string;
  ip: string;
  tabla_afectada: string;
  registro_id: string;
  datos_antes: string | null;   // JSON
  datos_despues: string | null; // JSON
  created_at: string;
}

// ---- Config ----
export interface ConfigApp {
  clave: string;
  valor: string;
  descripcion: string;
  updated_at: string;
}

// ---- API Shapes ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// ---- Dashboard Stats ----
export interface DashboardStats {
  total_usuarios_activos: number;
  saldo_total_sistema: number;
  saldo_pendiente_aprobacion: number;
  ingresos_mes: number;
  ingresos_anio: number;
  reservas_activas: number;
  ocupacion_promedio: number;
}

// ---- Bank Info for prepaid load ----
export interface DatosBancarios {
  banco: string;
  titular: string;
  cbu_cvu: string;
  alias: string;
  cuit: string;
}