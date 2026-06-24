import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, all, first } from "@/lib/db";
import { aprobarCargaSaldo } from "@/lib/accounting/book";
import { registrarAuditoria } from "@/lib/audit";
import { ResolucionSolicitudSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const db = getDB();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") ?? "pendiente";

    const solicitudes = await all(
      db,
      `SELECT s.*, u.nombre, u.apellido, u.email
       FROM solicitudes_saldo s JOIN usuarios u ON s.usuario_id = u.id
       WHERE s.estado = ? ORDER BY s.created_at DESC`,
      [estado]
    );

    return NextResponse.json({ success: true, data: solicitudes });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const body = await request.json();
    const parsed = ResolucionSolicitudSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
    }

    const db = getDB();
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    if (parsed.data.aprobado) {
      const result = await aprobarCargaSaldo(db, parsed.data.solicitud_id, payload.sub);
      await registrarAuditoria(db, {
        usuarioId: payload.sub,
        accion: "aprobar_carga_saldo",
        ip,
        tablaAfectada: "solicitudes_saldo",
        registroId: parsed.data.solicitud_id,
        datosDespues: { saldoFinal: result.saldoFinal },
      });
      return NextResponse.json({ success: true, data: result });
    } else {
      const motivo = parsed.data.motivo_rechazo ?? "Sin motivo especificado";
      await db.prepare(
        `UPDATE solicitudes_saldo SET estado = 'rechazada', admin_id = ?, motivo_rechazo = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(payload.sub, motivo, parsed.data.solicitud_id).run();

      await registrarAuditoria(db, {
        usuarioId: payload.sub,
        accion: "rechazar_carga_saldo",
        ip,
        tablaAfectada: "solicitudes_saldo",
        registroId: parsed.data.solicitud_id,
        datosDespues: { motivo },
      });
      return NextResponse.json({ success: true, data: { estado: "rechazada" } });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
