import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { getDB, first } from "@/lib/db";
import type { User } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    const db = getDB();
    const user = await first<User>(db, `SELECT * FROM usuarios WHERE id = ? AND estado = 'activo'`, [payload.sub]);
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 401 });
    }

    const accessToken = await generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    const response = NextResponse.json({ success: true, data: { accessToken } });
    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true, secure: true, sameSite: "strict",
      path: "/api/auth/refresh", maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Sesión expirada" }, { status: 401 });
  }
}
