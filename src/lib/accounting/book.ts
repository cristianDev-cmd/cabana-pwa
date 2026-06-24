import type { D1Database } from "@cloudflare/workers-types";
import { v4 as uuidv4 } from "uuid";
import type { TipoMovimiento, Movimiento } from "@/types";
import { all, first, execute, batch } from "@/lib/db";

// ============================================================
// IMMUTABLE ACCOUNTING LEDGER
// CRITICAL: Saldo nunca se modifica con UPDATE directo.
// Cada operación INSERTA un movimiento que reconstruye el saldo.
// ============================================================

/** Get current balance for a user by summing all movements */
export async function getSaldoActual(db: D1Database, usuarioId: string): Promise<number> {
  const result = await first<{ ultimo: number | null }>(
    db,
    `SELECT saldo_posterior AS ultimo
     FROM movimientos
     WHERE usuario_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [usuarioId]
  );
  return result?.ultimo ?? 0;
}

/** Get full movement history */
export async function getMovimientos(
  db: D1Database,
  usuarioId: string,
  limit = 50,
  offset = 0
): Promise<Movimiento[]> {
  return all<Movimiento>(
    db,
    `SELECT * FROM movimientos
     WHERE usuario_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [usuarioId, limit, offset]
  );
}

/** Record a movement atomically. Returns the new balance. */
export async function registrarMovimiento(
  db: D1Database,
  params: {
    usuarioId: string;
    tipo: TipoMovimiento;
    monto: number;            // Positive = credit, negative = debit
    referenciaTabla: string;
    referenciaId: string;
    adminId?: string | null;
  }
): Promise<{ movimientoId: string; saldoFinal: number }> {
  // 1. Get current balance
  const saldoAnterior = await getSaldoActual(db, params.usuarioId);

  // 2. Calculate new balance
  const saldoPosterior = saldoAnterior + params.monto;

  // 3. NEVER allow negative balance
  if (saldoPosterior < 0) {
    throw new Error(`Saldo insuficiente: actual=${saldoAnterior}, débito=${Math.abs(params.monto)}`);
  }

  // 4. Insert immutable movement row
  const movimientoId = uuidv4();
  await execute(
    db,
    `INSERT INTO movimientos (id, usuario_id, tipo, saldo_anterior, monto_movimiento, saldo_posterior, referencia_tabla, referencia_id, admin_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movimientoId,
      params.usuarioId,
      params.tipo,
      saldoAnterior,
      params.monto,
      saldoPosterior,
      params.referenciaTabla,
      params.referenciaId,
      params.adminId ?? null,
    ]
  );

  return { movimientoId, saldoFinal: saldoPosterior };
}

/** Aprobar una solicitud de saldo: inserta movimiento + actualiza solicitud en batch */
export async function aprobarCargaSaldo(
  db: D1Database,
  solicitudId: string,
  adminId: string
): Promise<{ saldoFinal: number }> {
  const solicitud = await first<{ usuario_id: string; monto: number }>(
    db,
    `SELECT usuario_id, monto FROM solicitudes_saldo WHERE id = ? AND estado = 'pendiente'`,
    [solicitudId]
  );
  if (!solicitud) throw new Error("Solicitud no encontrada o ya procesada");

  const movimientoId = uuidv4();
  const saldoAnterior = await getSaldoActual(db, solicitud.usuario_id);
  const saldoPosterior = saldoAnterior + solicitud.monto;

  await batch(db, [
    {
      query: `INSERT INTO movimientos (id, usuario_id, tipo, saldo_anterior, monto_movimiento, saldo_posterior, referencia_tabla, referencia_id, admin_id)
              VALUES (?, ?, 'carga_aprobada', ?, ?, ?, 'solicitudes_saldo', ?, ?)`,
      bindings: [movimientoId, solicitud.usuario_id, saldoAnterior, solicitud.monto, saldoPosterior, solicitudId, adminId],
    },
    {
      query: `UPDATE solicitudes_saldo SET estado = 'aprobada', admin_id = ?, updated_at = datetime('now') WHERE id = ?`,
      bindings: [adminId, solicitudId],
    },
  ]);

  return { saldoFinal: saldoPosterior };
}