import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, first, all, execute } from "@/lib/db";
import { getSaldoActual } from "@/lib/accounting/book";
import { registrarAuditoria } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const db = getDB();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    let whereClause = "";
    const bindings: unknown[] = [];
    if (query) {
      whereClause = `WHERE nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR dni LIKE ?`;
      bindings.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }

    const [usuarios, countResult] = await Promise.all([
      all(db, `SELECT id, dni, email, nombre, apellido, telefono, role, estado, created_at FROM usuarios ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...bindings, limit, offset]),
      first<{ total: number }>(db, `SELECT COUNT(*) as total FROM usuarios ${whereClause}`, bindings),
    ]);

    // Get balance for each user
    const usersWithBalance = await Promise.all(
      (usuarios as { id: string }[]).map(async (u) => ({
        ...u,
        saldo: await getSaldoActual(db, u.id),
      }))
    );

    return NextResponse.json({
      success: true,
      data: usersWithBalance,
      meta: { total: countResult?.total ?? 0, page, limit },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const { usuarioId, accion } = await request.json() as { usuarioId: string; accion: "bloquear" | "desbloquear" };
    if (!usuarioId) return NextResponse.json({ success: false, error: "usuarioId requerido" }, { status: 400 });

    const db = getDB();
    const nuevoEstado = accion === "bloquear" ? "bloqueado" : "activo";
    await execute(db, `UPDATE usuarios SET estado = ?, updated_at = datetime('now') WHERE id = ?`, [nuevoEstado, usuarioId]);

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await registrarAuditoria(db, {
      usuarioId: payload.sub,
      accion: `usuario_${nuevoEstado}`,
      ip,
      tablaAfectada: "usuarios",
      registroId: usuarioId,
    });

    return NextResponse.json({ success: true, data: { estado: nuevoEstado } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
