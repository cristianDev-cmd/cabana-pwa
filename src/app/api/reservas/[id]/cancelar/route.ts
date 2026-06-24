import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB } from "@/lib/db";
import { cancelarReserva } from "@/lib/booking/engine";
import { registrarAuditoria } from "@/lib/audit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await authenticate(request.headers);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const motivo = body.motivo as string | undefined;

    const db = getDB();
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    const resultado = await cancelarReserva(db, id, payload.sub, motivo);

    await registrarAuditoria(db, {
      usuarioId: payload.sub,
      accion: "cancelar_reserva",
      ip,
      tablaAfectada: "reservas",
      registroId: id,
      datosDespues: resultado,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Reserva cancelada. Devolución: $${resultado.devolucion} (${resultado.porcentaje}%)`,
        ...resultado,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
