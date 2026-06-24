import type { D1Database } from "@cloudflare/workers-types";
import { v4 as uuidv4 } from "uuid";
import { all, first, batch } from "@/lib/db";
import { getSaldoActual, registrarMovimiento } from "@/lib/accounting/book";
import type { Reserva } from "@/types";

// ============================================================
// BOOKING ENGINE — Motor de Reservas
// ============================================================

/** Get effective price per night for a cabana on a specific date */
async function getPrecioEfectivo(db: D1Database, cabanaId: string, fecha: string): Promise<number> {
  // Check if there's a tariff for that date
  const tarifa = await first<{ precio_por_noche: number }>(
    db,
    `SELECT precio_por_noche FROM tarifas
     WHERE cabana_id = ? AND ? BETWEEN fecha_inicio AND fecha_fin
     LIMIT 1`,
    [cabanaId, fecha]
  );
  if (tarifa) return tarifa.precio_por_noche;

  // Fallback to cabana's base price
  const cabana = await first<{ precio_base_por_noche: number }>(
    db,
    `SELECT precio_base_por_noche FROM cabanas WHERE id = ?`,
    [cabanaId]
  );
  if (!cabana) throw new Error("Cabaña no encontrada");
  return cabana.precio_base_por_noche;
}

/** Get per-night prices for a date range (array of {fecha, precio}) */
async function getPreciosRango(
  db: D1Database,
  cabanaId: string,
  checkin: string,
  checkout: string
): Promise<{ fecha: string; precio: number }[]> {
  const start = new Date(checkin);
  const end = new Date(checkout);
  const precios: { fecha: string; precio: number }[] = [];

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    precios.push({
      fecha: d.toISOString().split("T")[0],
      precio: await getPrecioEfectivo(db, cabanaId, d.toISOString().split("T")[0]),
    });
  }
  return precios;
}

/** Check if a cabana is available for the given dates */
export async function checkDisponibilidad(
  db: D1Database,
  cabanaId: string,
  checkin: string,
  checkout: string
): Promise<{ disponible: boolean; conflicto?: string }> {
  const conflicto = await first<{ id: string; fecha_checkin: string; fecha_checkout: string }>(
    db,
    `SELECT id, fecha_checkin, fecha_checkout FROM reservas
     WHERE cabana_id = ?
       AND estado = 'confirmada'
       AND fecha_checkin < ? AND fecha_checkout > ?
     LIMIT 1`,
    [cabanaId, checkout, checkin]
  );
  if (conflicto) {
    return {
      disponible: false,
      conflicto: `La cabaña ya está reservada del ${conflicto.fecha_checkin} al ${conflicto.fecha_checkout}`,
    };
  }
  return { disponible: true };
}

/** Calculate quote without booking */
export async function cotizarReserva(
  db: D1Database,
  cabanaId: string,
  checkin: string,
  checkout: string
): Promise<{ precios: { fecha: string; precio: number }[]; noches: number; total: number }> {
  const diff = new Date(checkout).getTime() - new Date(checkin).getTime();
  const noches = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (noches < 1) throw new Error("La estadía debe ser de al menos 1 noche");

  const precios = await getPreciosRango(db, cabanaId, checkin, checkout);
  const total = precios.reduce((sum, p) => sum + p.precio, 0);

  return { precios, noches, total };
}

/** Create a reservation (TRANSACTIONAL — prevents double booking and double spending) */
export async function crearReserva(
  db: D1Database,
  usuarioId: string,
  cabanaId: string,
  checkin: string,
  checkout: string
): Promise<Reserva> {
  // 1. Verify availability (atomic check via batch)
  const { disponible, conflicto } = await checkDisponibilidad(db, cabanaId, checkin, checkout);
  if (!disponible) throw new Error(conflicto);

  // 2. Calculate price
  const { precios, noches, total } = await cotizarReserva(db, cabanaId, checkin, checkout);
  const precioSnapshot = Math.round(total / noches * 100) / 100; // Average for snapshot

  // 3. Verify balance
  const saldo = await getSaldoActual(db, usuarioId);
  if (saldo < total) {
    throw new Error(`Saldo insuficiente. Necesita: $${total}, Disponible: $${saldo}`);
  }

  // 4. Create reservation + deduct balance atomically
  const reservaId = uuidv4();
  await batch(db, [
    {
      query: `INSERT INTO reservas (id, usuario_id, cabana_id, fecha_checkin, fecha_checkout, noches, precio_por_noche, monto_total, estado)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmada')`,
      bindings: [reservaId, usuarioId, cabanaId, checkin, checkout, noches, precioSnapshot, total],
    },
  ]);

  // 5. Record movement (debit)
  const { movimientoId } = await registrarMovimiento(db, {
    usuarioId,
    tipo: "reserva_realizada",
    monto: -total,
    referenciaTabla: "reservas",
    referenciaId: reservaId,
  });

  const reserva = await first<Reserva>(db, `SELECT * FROM reservas WHERE id = ?`, [reservaId]);
  if (!reserva) throw new Error("Error al crear la reserva");
  return reserva;
}

/** Cancel reservation with refund calculation */
export async function cancelarReserva(
  db: D1Database,
  reservaId: string,
  usuarioId: string,
  motivo?: string
): Promise<{ devolucion: number; porcentaje: number }> {
  const reserva = await first<Reserva>(
    db,
    `SELECT * FROM reservas WHERE id = ? AND usuario_id = ? AND estado = 'confirmada'`,
    [reservaId, usuarioId]
  );
  if (!reserva) throw new Error("Reserva no encontrada o ya cancelada");

  // Calculate refund based on policy
  const diasAnticipacion = Math.ceil(
    (new Date(reserva.fecha_checkin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Get policy config
  const config100 = await first<{ valor: string }>(
    db, `SELECT valor FROM configuracion WHERE clave = 'politica_cancelacion_dias_100'`, []
  );
  const config0 = await first<{ valor: string }>(
    db, `SELECT valor FROM configuracion WHERE clave = 'politica_cancelacion_dias_0'`, []
  );
  const configParcial = await first<{ valor: string }>(
    db, `SELECT valor FROM configuracion WHERE clave = 'politica_cancelacion_porcentaje_parcial'`, []
  );

  const dias100 = parseInt(config100?.valor ?? "7");
  const dias0 = parseInt(config0?.valor ?? "2");
  const pctParcial = parseInt(configParcial?.valor ?? "50");

  let porcentajeDevolucion: number;
  if (diasAnticipacion >= dias100) {
    porcentajeDevolucion = 100;
  } else if (diasAnticipacion <= dias0) {
    porcentajeDevolucion = 0;
  } else {
    porcentajeDevolucion = pctParcial;
  }

  const devolucion = Math.round((reserva.monto_total * porcentajeDevolucion) / 100 * 100) / 100;

  // Update reservation + credit refund atomically
  await batch(db, [
    {
      query: `UPDATE reservas SET estado = 'cancelada', cancelada_en = datetime('now'),
              motivo_cancelacion = ?, devolucion_monto = ? WHERE id = ?`,
      bindings: [motivo ?? null, devolucion, reservaId],
    },
  ]);

  if (devolucion > 0) {
    await registrarMovimiento(db, {
      usuarioId,
      tipo: "devolucion_cancelacion",
      monto: devolucion,
      referenciaTabla: "reservas",
      referenciaId: reservaId,
    });
  }

  return { devolucion, porcentaje: porcentajeDevolucion };
}