import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, first, execute, all } from "@/lib/db";
import { CabanaUpdateSchema } from "@/lib/validation/schemas";
import { registrarAuditoria } from "@/lib/audit";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = getDB();
    const cabana = await first(db, `SELECT * FROM cabanas WHERE id = ?`, [id]);
    if (!cabana) return NextResponse.json({ success: false, error: "Cabaña no encontrada" }, { status: 404 });

    const imagenes = await all(db, `SELECT * FROM cabana_imagenes WHERE cabana_id = ? ORDER BY orden ASC`, [id]);
    const tarifas = await all(db, `SELECT * FROM tarifas WHERE cabana_id = ? ORDER BY fecha_inicio ASC`, [id]);

    return NextResponse.json({ success: true, data: { ...cabana, imagenes, tarifas } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const { id } = await context.params;
    const body = await request.json();
    const parsed = CabanaUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });

    const db = getDB();
    const data = parsed.data;
    const servicios = data.servicios ? JSON.stringify(data.servicios) : undefined;

    await execute(
      db,
      `UPDATE cabanas SET
        nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        capacidad = COALESCE(?, capacidad),
        ubicacion = COALESCE(?, ubicacion),
        latitud = COALESCE(?, latitud),
        longitud = COALESCE(?, longitud),
        servicios = COALESCE(?, servicios),
        precio_base_por_noche = COALESCE(?, precio_base_por_noche),
        estado = COALESCE(?, estado),
        updated_at = datetime('now')
       WHERE id = ?`,
      [data.nombre ?? null, data.descripcion ?? null, data.capacidad ?? null,
       data.ubicacion ?? null, data.latitud ?? null, data.longitud ?? null,
       servicios ?? null, data.precio_base_por_noche ?? null, data.estado ?? null, id]
    );

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await registrarAuditoria(db, { usuarioId: payload.sub, accion: "actualizar_cabana", ip, tablaAfectada: "cabanas", registroId: id, datosDespues: data });

    const cabana = await first(db, `SELECT * FROM cabanas WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, data: cabana });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
