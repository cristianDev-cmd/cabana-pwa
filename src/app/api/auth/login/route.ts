import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { LoginSchema } from "@/lib/validation/schemas";
import { getDB, first } from "@/lib/db";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { registrarAuditoria } from "@/lib/audit";
import type { User } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos", detalles: parsed.error.format() },
        { status: 400 }
      );
    }

    const db = getDB();
    const user = await first<User>(
      db,
      `SELECT * FROM usuarios WHERE email = ?`,
      [parsed.data.email]
    );

    if (!user) {
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    if (user.estado === "bloqueado") {
      return NextResponse.json({ success: false, error: "Cuenta bloqueada. Contacte al administrador." }, { status: 403 });
    }

    const validPassword = await compare(parsed.data.password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Audit
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("cf-connecting-ip") ?? "unknown";
    await registrarAuditoria(db, {
      usuarioId: user.id,
      accion: "login",
      ip,
      tablaAfectada: "usuarios",
      registroId: user.id,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          dni: user.dni,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          telefono: user.telefono,
          role: user.role,
          avatar_url: user.avatar_url,
        },
      },
    });

    // HTTP-only refresh token cookie
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
