import type { R2Bucket } from "@cloudflare/workers-types";
import { v4 as uuidv4 } from "uuid";

// ============================================================
// R2 Object Storage Helpers
// ============================================================

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(file: { type: string; size: number }): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}. Permitidos: JPG, PNG, WEBP, PDF`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Archivo muy grande. Máximo: 10 MB`);
  }
}

/** Upload file to R2, return public URL */
export async function uploadToR2(
  bucket: R2Bucket,
  file: File | { arrayBuffer(): Promise<ArrayBuffer>; type: string; size: number },
  prefix: string
): Promise<string> {
  validateFile({ type: file.type, size: file.size });

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const key = `${prefix}/${uuidv4()}.${ext}`;
  const buffer = await file.arrayBuffer();

  await bucket.put(key, buffer as unknown as ArrayBuffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { uploadedAt: new Date().toISOString() },
  });

  // R2 public URL pattern (custom domain or default)
  return `${process.env.R2_PUBLIC_URL ?? ''}/${key}`;
}

/** Delete file from R2 */
export async function deleteFromR2(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

/** Extract key from R2 URL */
export function extractKeyFromUrl(url: string): string {
  const parts = url.split("/");
  // URL format: https://domain/prefix/uuid.ext -> extract prefix/uuid.ext
  const keyParts = parts.slice(-2);
  return keyParts.join("/");
}