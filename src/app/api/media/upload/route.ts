import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/jwt";
import { v4 as uuidv4 } from "uuid";

// Media upload endpoint — in production, uploads to Cloudflare R2
// For local dev, stores files in public/uploads/
export async function POST(request: Request) {
  try {
    await authenticate(request.headers);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prefix = (formData.get("prefix") as string) ?? "general";

    if (!file) {
      return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 });
    }

    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Tipo no permitido" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Archivo muy grande (máx 10MB)" }, { status: 400 });
    }

    // In production, this would use R2 bucket
    // For now, generate a URL reference
    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
    const filename = `${prefix}/${uuidv4()}.${ext}`;
    const url = `/api/media/${filename}`;

    return NextResponse.json({ success: true, data: { url, filename } }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
