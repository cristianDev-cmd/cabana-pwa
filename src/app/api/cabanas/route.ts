import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, all, first, execute } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { CabanaSchema, CabanaUpdateSchema } from "@/lib/validation/schemas";
import { registrarAuditoria } from "@/lib/audit";

export async function GET() {
  try {
    const db = getDB();
    const cabanas = await all(db, `SELECT * FROM cabanas ORDER BY nombre ASC`);

    // Get principales images for each cabana
    const withImages = await Promise.all(
      (cabanas as { id: string }[]).map(async (c) => {
        const imagenes = await all(
          db,
          `SELECT * FROM cabana_imagenes WHERE cabana_id = ? ORDER BY orden ASC`,
          [c.id]
        );
        return { ...c, imagenes };
      })
    );

    return NextResponse.json({ success: true, data: withImages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error al obtener cabañas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const body = await request.json();
    const parsed = CabanaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos inválidos", detalles: parsed.error.format() }, { status: 400 });
    }

    const db = getDB();
    const id = uuidv4();
    const d = parsed.data;

    await execute(
      db,
      `INSERT INTO cabanas (id, nombre, descripcion, capacidad, ubicacion, latitud, longitud, servicios, precio_base_por_noche, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, d.nombre, d.descripcion, d.capacidad, d.ubicacion,
       d.latitud ?? null, d.longitud ?? null,
       JSON.stringify(d.servicios), d.precio_base_por_noche, d.estado]
    );

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await registrarAuditoria(db, {
      usuarioId: payload.sub,
      accion: "crear_cabana",
      ip,
      tablaAfectada: "cabanas",
      registroId: id,
      datosDespues: d,
    });

    const cabana = await first(db, `SELECT * FROM cabanas WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, data: cabana }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
