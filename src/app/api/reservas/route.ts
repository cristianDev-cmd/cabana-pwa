import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, all, first } from "@/lib/db";
import { crearReserva } from "@/lib/booking/engine";
import { registrarAuditoria } from "@/lib/audit";
import { ReservaSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    let query = `SELECT r.*, c.nombre as cabana_nombre, c.ubicacion as cabana_ubicacion
                 FROM reservas r JOIN cabanas c ON r.cabana_id = c.id
                 WHERE r.usuario_id = ?`;
    const bindings: unknown[] = [payload.sub];

    if (estado) {
      query += ` AND r.estado = ?`;
      bindings.push(estado);
    }
    query += ` ORDER BY r.created_at DESC`;

    const reservas = await all(db, query, bindings);
    return NextResponse.json({ success: true, data: reservas });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    const body = await request.json();
    const parsed = ReservaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos inválidos", detalles: parsed.error.format() }, { status: 400 });
    }

    const db = getDB();
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    const reserva = await crearReserva(
      db, payload.sub, parsed.data.cabana_id,
      parsed.data.fecha_checkin, parsed.data.fecha_checkout
    );

    await registrarAuditoria(db, {
      usuarioId: payload.sub,
      accion: "crear_reserva",
      ip,
      tablaAfectada: "reservas",
      registroId: reserva.id,
      datosDespues: reserva,
    });

    return NextResponse.json({ success: true, data: reserva }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
