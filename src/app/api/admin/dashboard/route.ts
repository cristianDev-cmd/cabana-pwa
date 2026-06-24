import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, first, all } from "@/lib/db";
import type { DashboardStats } from "@/types";

export async function GET(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }

    const db = getDB();

    const [usuarios, saldoTotal, saldoPendiente, ingresosMes, ingresosAnio, reservasActivas] =
      await Promise.all([
        first<{ total: number }>(db, `SELECT COUNT(*) as total FROM usuarios WHERE estado = 'activo'`),
        first<{ total: number }>(db, `SELECT COALESCE(SUM(saldo_posterior), 0) as total FROM (SELECT usuario_id, MAX(created_at) as max_created FROM movimientos GROUP BY usuario_id) latest JOIN movimientos m ON m.usuario_id = latest.usuario_id AND m.created_at = latest.max_created WHERE m.saldo_posterior > 0`),
        first<{ total: number }>(db, `SELECT COALESCE(SUM(monto), 0) as total FROM solicitudes_saldo WHERE estado = 'pendiente'`),
        first<{ total: number }>(db, `SELECT COALESCE(SUM(monto_total), 0) as total FROM reservas WHERE estado = 'confirmada' AND created_at >= datetime('now', 'start of month')`),
        first<{ total: number }>(db, `SELECT COALESCE(SUM(monto_total), 0) as total FROM reservas WHERE estado = 'confirmada' AND created_at >= datetime('now', 'start of year')`),
        first<{ total: number }>(db, `SELECT COUNT(*) as total FROM reservas WHERE estado = 'confirmada'`),
      ]);

    const totalCabanas = await first<{ total: number }>(
      db, `SELECT COUNT(*) as total FROM cabanas WHERE estado = 'activa'`
    );

    const stats: DashboardStats = {
      total_usuarios_activos: usuarios?.total ?? 0,
      saldo_total_sistema: Math.round((saldoTotal?.total ?? 0) * 100) / 100,
      saldo_pendiente_aprobacion: saldoPendiente?.total ?? 0,
      ingresos_mes: ingresosMes?.total ?? 0,
      ingresos_anio: ingresosAnio?.total ?? 0,
      reservas_activas: reservasActivas?.total ?? 0,
      ocupacion_promedio: totalCabanas?.total ? Math.round(((reservasActivas?.total ?? 0) / totalCabanas.total) * 100) : 0,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
