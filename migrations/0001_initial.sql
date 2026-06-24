-- ============================================================
-- CabanaPWA: Initial Database Migration
-- Cloudflare D1 (SQLite)
-- ============================================================

-- ----------------------------------------------------------
-- 1. USUARIOS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,                          -- UUID
    dni TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT NOT NULL,
    direccion TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'cliente' CHECK(role IN ('cliente', 'admin')),
    estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'bloqueado')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_dni ON usuarios(dni);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- Admin seed (password: Admin123!)
INSERT OR IGNORE INTO usuarios (id, dni, email, password_hash, nombre, apellido, telefono, direccion, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000',
  'admin@cabanapwa.com',
  '$2a$10$placeholder_hash_for_admin', -- Replace on first deploy
  'Admin',
  'Sistema',
  '0000000000',
  'Oficina Central',
  'admin'
);

-- ----------------------------------------------------------
-- 2. CABAÑAS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cabanas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    capacidad INTEGER NOT NULL CHECK(capacidad > 0),
    ubicacion TEXT NOT NULL,
    latitud REAL,
    longitud REAL,
    servicios TEXT NOT NULL DEFAULT '[]',          -- JSON array
    precio_base_por_noche REAL NOT NULL CHECK(precio_base_por_noche > 0),
    estado TEXT NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa', 'inactiva', 'mantenimiento')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cabanas_estado ON cabanas(estado);

-- ----------------------------------------------------------
-- 3. IMÁGENES DE CABAÑAS (URLs stored in R2)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cabana_imagenes (
    id TEXT PRIMARY KEY,
    cabana_id TEXT NOT NULL REFERENCES cabanas(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    es_principal INTEGER NOT NULL DEFAULT 0,     -- boolean: 0 or 1
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cabana_imagenes_cabana ON cabana_imagenes(cabana_id);

-- ----------------------------------------------------------
-- 4. TARIFAS (Variable Pricing by Date Range)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarifas (
    id TEXT PRIMARY KEY,
    cabana_id TEXT NOT NULL REFERENCES cabanas(id) ON DELETE CASCADE,
    fecha_inicio TEXT NOT NULL,                   -- ISO date YYYY-MM-DD
    fecha_fin TEXT NOT NULL,                      -- ISO date YYYY-MM-DD
    precio_por_noche REAL NOT NULL CHECK(precio_por_noche > 0),
    tipo TEXT NOT NULL DEFAULT 'temporada_alta'
      CHECK(tipo IN ('temporada_alta', 'temporada_baja', 'especial', 'feriado', 'finde')),
    descripcion TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tarifas_cabana_fechas ON tarifas(cabana_id, fecha_inicio, fecha_fin);

-- ----------------------------------------------------------
-- 5. MOVIMIENTOS — LIBRO CONTABLE INMUTABLE
--    PROHIBIDO UPDATE. Solo INSERT.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    tipo TEXT NOT NULL CHECK(tipo IN (
      'carga_aprobada',
      'reserva_realizada',
      'devolucion_cancelacion',
      'ajuste_administrativo'
    )),
    saldo_anterior REAL NOT NULL,
    monto_movimiento REAL NOT NULL,
    saldo_posterior REAL NOT NULL CHECK(saldo_posterior >= 0),  -- Jamás negativo
    referencia_tabla TEXT NOT NULL,
    referencia_id TEXT NOT NULL,
    admin_id TEXT REFERENCES usuarios(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_movimientos_usuario ON movimientos(usuario_id, created_at);
CREATE INDEX idx_movimientos_tipo ON movimientos(tipo, created_at);

-- ----------------------------------------------------------
-- 6. SOLICITUDES DE SALDO
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes_saldo (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    monto REAL NOT NULL CHECK(monto > 0),
    banco_origen TEXT NOT NULL,
    referencia_transferencia TEXT NOT NULL,
    fecha_transferencia TEXT NOT NULL,
    comprobante_url TEXT NOT NULL,               -- R2 URL
    estado TEXT NOT NULL DEFAULT 'pendiente'
      CHECK(estado IN ('pendiente', 'aprobada', 'rechazada')),
    admin_id TEXT REFERENCES usuarios(id),
    motivo_rechazo TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_solicitudes_usuario ON solicitudes_saldo(usuario_id, created_at);
CREATE INDEX idx_solicitudes_estado ON solicitudes_saldo(estado);

-- ----------------------------------------------------------
-- 7. RESERVAS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    cabana_id TEXT NOT NULL REFERENCES cabanas(id),
    fecha_checkin TEXT NOT NULL,
    fecha_checkout TEXT NOT NULL,
    noches INTEGER NOT NULL CHECK(noches > 0),
    precio_por_noche REAL NOT NULL,              -- Snapshot congelado
    monto_total REAL NOT NULL CHECK(monto_total > 0),
    estado TEXT NOT NULL DEFAULT 'confirmada'
      CHECK(estado IN ('confirmada', 'cancelada', 'completada')),
    cancelada_en TEXT,
    motivo_cancelacion TEXT,
    devolucion_monto REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK(fecha_checkout > fecha_checkin)
);

CREATE INDEX idx_reservas_usuario ON reservas(usuario_id, created_at);
CREATE INDEX idx_reservas_cabana_fechas ON reservas(cabana_id, fecha_checkin, fecha_checkout);
CREATE INDEX idx_reservas_estado ON reservas(estado);

-- ----------------------------------------------------------
-- 8. AUDITORÍA — Todas las acciones críticas
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    accion TEXT NOT NULL,
    ip TEXT NOT NULL,
    tabla_afectada TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    datos_antes TEXT,                              -- JSON
    datos_despues TEXT,                            -- JSON
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id, created_at);
CREATE INDEX idx_auditoria_accion ON auditoria(accion, created_at);

-- ----------------------------------------------------------
-- 9. CONFIGURACIÓN DEL SISTEMA
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default configuration
INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES
  ('datos_bancarios', '{"banco":"Banco Nación","titular":"CabanaPWA S.A.","cbu_cvu":"0000000000000000000000","alias":"cabana.pwa","cuit":"30-00000000-0"}', 'Datos bancarios para transferencias'),
  ('politica_cancelacion_dias_100', '7', 'Días de anticipación para devolución 100%'),
  ('politica_cancelacion_dias_0', '2', 'Días límite para devolución 0%'),
  ('politica_cancelacion_porcentaje_parcial', '50', 'Porcentaje devolución entre rango medio'),
  ('app_nombre', 'CabanaPWA', 'Nombre de la aplicación'),
  ('app_moneda', 'ARS', 'Moneda del sistema'),
  ('app_zona_horaria', 'America/Argentina/Buenos_Aires', 'Zona horaria');