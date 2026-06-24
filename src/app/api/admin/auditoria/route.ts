import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB } from "@/lib/db";
import { getAuditoria } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const db = getDB();
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuario_id") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const offset = (page - 1) * limit;

    const registros = await getAuditoria(db, limit, offset, usuarioId);
    return NextResponse.json({ success: true, data: registros, meta: { page, limit } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
