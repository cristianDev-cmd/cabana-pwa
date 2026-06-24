import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { getDB, first, execute } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { SolicitudSaldoSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const payload = await authenticate(request.headers);

    const formData = await request.formData();
    const monto = parseFloat(formData.get("monto") as string);
    const banco_origen = formData.get("banco_origen") as string;
    const referencia_transferencia = formData.get("referencia_transferencia") as string;
    const fecha_transferencia = formData.get("fecha_transferencia") as string;
    const comprobante = formData.get("comprobante") as File | null;

    const parsed = SolicitudSaldoSchema.safeParse({ monto, banco_origen, referencia_transferencia, fecha_transferencia });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos inválidos", detalles: parsed.error.format() }, { status: 400 });
    }

    if (!comprobante) {
      return NextResponse.json({ success: false, error: "Comprobante requerido" }, { status: 400 });
    }

    // TODO: Upload comprobante to R2
    // In dev mode, store the file reference
    const comprobanteUrl = `/uploads/${uuidv4()}_${comprobante.name}`;

    const db = getDB();
    const id = uuidv4();

    await execute(
      db,
      `INSERT INTO solicitudes_saldo (id, usuario_id, monto, banco_origen, referencia_transferencia, fecha_transferencia, comprobante_url, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [id, payload.sub, parsed.data.monto, parsed.data.banco_origen, parsed.data.referencia_transferencia, parsed.data.fecha_transferencia, comprobanteUrl]
    );

    return NextResponse.json({ success: true, data: { id, message: "Solicitud enviada. Aguarde la validación del administrador." } }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
