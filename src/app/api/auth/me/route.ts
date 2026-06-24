import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, first } from "@/lib/db";
import { getSaldoActual } from "@/lib/accounting/book";
import type { User } from "@/types";

export async function GET(request: Request) {
  try {
    const payload = await authenticate(request.headers);

    const db = getDB();
    const user = await first<User>(db, `SELECT * FROM usuarios WHERE id = ?`, [payload.sub]);
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const saldo = await getSaldoActual(db, user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        dni: user.dni,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        telefono: user.telefono,
        direccion: user.direccion,
        avatar_url: user.avatar_url,
        role: user.role,
        estado: user.estado,
        saldo,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error de autenticación";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
