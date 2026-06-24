import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, execute, first } from "@/lib/db";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await authenticate(request.headers);
    if (payload.role !== "admin") return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });

    const { id } = await context.params;
    const db = getDB();
    await execute(db, `DELETE FROM tarifas WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
