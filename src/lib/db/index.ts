import type { D1Database } from "@cloudflare/workers-types";
import { v4 as uuidv4 } from "uuid";

// ============================================================
// Database access layer for Cloudflare D1
// All functions receive the D1 binding directly (Edge-compatible)
// ============================================================

let _db: D1Database | null = null;

export function setDB(db: D1Database) {
  _db = db;
}

export function getDB(): D1Database {
  if (!_db) throw new Error("D1 Database not initialized");
  return _db;
}

/** Generate a UUID v4 */
export function genId(): string {
  return uuidv4();
}

/** Current ISO timestamp */
export function now(): string {
  return new Date().toISOString();
}

/** Execute and return first row or null */
export async function first<T>(
  db: D1Database,
  query: string,
  bindings: unknown[] = []
): Promise<T | null> {
  const result = await db.prepare(query).bind(...bindings).first<T>();
  return result ?? null;
}

/** Execute and return all rows */
export async function all<T>(
  db: D1Database,
  query: string,
  bindings: unknown[] = []
): Promise<T[]> {
  const result = await db.prepare(query).bind(...bindings).all<T>();
  return result.results;
}

/** Execute a mutation and return the result (for INSERT/UPDATE/DELETE) */
export async function execute(
  db: D1Database,
  query: string,
  bindings: unknown[] = []
): Promise<D1Result> {
  return db.prepare(query).bind(...bindings).run();
}

/** Run multiple statements in a batch (for transactional consistency) */
export async function batch(
  db: D1Database,
  statements: { query: string; bindings: unknown[] }[]
): Promise<D1Result[]> {
  return db.batch(
    statements.map((s) => db.prepare(s.query).bind(...s.bindings))
  );
}

// Redefine D1Result locally to avoid type issues
interface D1Result {
  success: boolean;
  meta: Record<string, unknown>;
  results?: unknown[];
}