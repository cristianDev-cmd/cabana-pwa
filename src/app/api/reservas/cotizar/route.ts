import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { cotizarReserva } from "@/lib/booking/engine";

export async function POST(request: Request) {
  try {
    const { cabana_id, fecha_checkin, fecha_checkout } = await request.json() as {
      cabana_id: string; fecha_checkin: string; fecha_checkout: string;
    };

    if (!cabana_id || !fecha_checkin || !fecha_checkout) {
      return NextResponse.json({ success: false, error: "Faltan parámetros" }, { status: 400 });
    }

    const db = getDB();
    const cotizacion = await cotizarReserva(db, cabana_id, fecha_checkin, fecha_checkout);
    return NextResponse.json({ success: true, data: cotizacion });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
