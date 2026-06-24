import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, all, execute } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { TarifaSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const cabanaId = searchParams.get("cabana_id");

    let query = `SELECT t.*, c.nombre as cabana_nombre FROM tarifas t JOIN cabanas c ON t.cabana_id = c.id`;
    const bindings: unknown[] = [];

    if (cabanaId) {
      query += ` WHERE t.cabana_id = ?`;
      bindings.push(cabanaId);
    }
    query += ` ORDER BY t.fecha_inicio ASC`;

    const tarifas = await all(db, query, bindings);
    return NextResponse.json({ success: true, data: tarifas });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const body = await request.json();
    const parsed = TarifaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });

    const db = getDB();
    const id = uuidv4();
    const d = parsed.data;

    await execute(
      db,
      `INSERT INTO tarifas (id, cabana_id, fecha_inicio, fecha_fin, precio_por_noche, tipo, descripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, d.cabana_id, d.fecha_inicio, d.fecha_fin, d.precio_por_noche, d.tipo, d.descripcion]
    );

    return NextResponse.json({ success: true, data: { id } }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
