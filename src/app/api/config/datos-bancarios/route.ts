import { NextResponse } from "next/server";
import { getDB, first } from "@/lib/db";
import type { DatosBancarios } from "@/types";

export async function GET() {
  try {
    const db = getDB();
    const config = await first<{ valor: string }>(
      db, `SELECT valor FROM configuracion WHERE clave = 'datos_bancarios'`
    );

    if (!config) {
      return NextResponse.json({ success: false, error: "Configuración no encontrada" }, { status: 404 });
    }

    const datos: DatosBancarios = JSON.parse(config.valor);
    return NextResponse.json({ success: true, data: datos });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al obtener datos" }, { status: 500 });
  }
}
