import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { checkDisponibilidad, cotizarReserva } from "@/lib/booking/engine";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    if (!desde || !hasta) {
      return NextResponse.json({ success: false, error: "Parámetros 'desde' y 'hasta' requeridos" }, { status: 400 });
    }

    const db = getDB();
    const disponibilidad = await checkDisponibilidad(db, id, desde, hasta);
    const cotizacion = await cotizarReserva(db, id, desde, hasta);

    return NextResponse.json({
      success: true,
      data: { ...disponibilidad, ...cotizacion },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
