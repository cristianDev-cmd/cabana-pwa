import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RegisterSchema } from "@/lib/validation/schemas";
import { getDB, first, execute } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos inválidos", detalles: parsed.error.format() },
        { status: 400 }
      );
    }

    const db = getDB();
    const { dni, email, password, nombre, apellido, telefono, direccion } = parsed.data;

    // Check uniqueness
    const existingEmail = await first(db, `SELECT id FROM usuarios WHERE email = ?`, [email]);
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "El email ya está registrado" }, { status: 409 });
    }

    const existingDni = await first(db, `SELECT id FROM usuarios WHERE dni = ?`, [dni]);
    if (existingDni) {
      return NextResponse.json({ success: false, error: "El DNI ya está registrado" }, { status: 409 });
    }

    const password_hash = await hash(password, 12);
    const id = uuidv4();

    await execute(
      db,
      `INSERT INTO usuarios (id, dni, email, password_hash, nombre, apellido, telefono, direccion, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cliente')`,
      [id, dni, email, password_hash, nombre, apellido, telefono, direccion]
    );

    return NextResponse.json(
      { success: true, data: { id, message: "Registro exitoso" } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
