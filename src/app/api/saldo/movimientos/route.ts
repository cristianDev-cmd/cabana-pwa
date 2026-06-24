import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB } from "@/lib/db";
import { getMovimientos, getSaldoActual } from "@/lib/accounting/book";

export async function GET(request: Request) {
  try {
    const payload = await authenticate(request.headers);
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "30");
    const offset = (page - 1) * limit;

    const [movimientos, saldo] = await Promise.all([
      getMovimientos(db, payload.sub, limit, offset),
      getSaldoActual(db, payload.sub),
    ]);

    return NextResponse.json({ success: true, data: { saldo_actual: saldo, movimientos } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
