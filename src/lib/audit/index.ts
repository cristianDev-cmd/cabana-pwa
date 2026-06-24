import type { D1Database } from "@cloudflare/workers-types";
import { v4 as uuidv4 } from "uuid";
import { execute, all } from "@/lib/db";
import type { Auditoria } from "@/types";

// ============================================================
// AUDIT SYSTEM — Logs every critical action
// ============================================================

export async function registrarAuditoria(
  db: D1Database,
  params: {
    usuarioId: string;
    accion: string;
    ip: string;
    tablaAfectada: string;
    registroId: string;
    datosAntes?: unknown;
    datosDespues?: unknown;
  }
): Promise<void> {
  await execute(
    db,
    `INSERT INTO auditoria (id, usuario_id, accion, ip, tabla_afectada, registro_id, datos_antes, datos_despues)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      params.usuarioId,
      params.accion,
      params.ip,
      params.tablaAfectada,
      params.registroId,
      params.datosAntes ? JSON.stringify(params.datosAntes) : null,
      params.datosDespues ? JSON.stringify(params.datosDespues) : null,
    ]
  );
}

export async function getAuditoria(
  db: D1Database,
  limit = 100,
  offset = 0,
  usuarioId?: string
): Promise<Auditoria[]> {
  if (usuarioId) {
    return all<Auditoria>(
      db,
      `SELECT * FROM auditoria WHERE usuario_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [usuarioId, limit, offset]
    );
  }
  return all<Auditoria>(
    db,
    `SELECT * FROM auditoria ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}