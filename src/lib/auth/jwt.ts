import { SignJWT, jwtVerify } from "jose";
import type { User } from "@/types";

// ============================================================
// JWT Token Management (Edge-compatible with jose)
// Uses environment variables set via wrangler secrets
// ============================================================

const getSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return new TextEncoder().encode(secret);
};

const getRefreshSecret = (): Uint8Array => {
  const secret = process.env.REFRESH_SECRET;
  if (!secret) throw new Error("REFRESH_SECRET not configured");
  return new TextEncoder().encode(secret);
};

export interface TokenPayload {
  sub: string;          // user.id
  role: "cliente" | "admin";
  email: string;
}

/** Generate access token (JWT, short-lived: 15 min) */
export async function generateAccessToken(user: Pick<User, "id" | "role" | "email">): Promise<string> {
  return new SignJWT({ role: user.role, email: user.email } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

/** Generate refresh token (HTTP-only, long-lived: 7 days) */
export async function generateRefreshToken(user: Pick<User, "id" | "role" | "email">): Promise<string> {
  return new SignJWT({ role: user.role, email: user.email } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshSecret());
}

/** Verify access token */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return {
    sub: payload.sub!,
    role: payload.role as TokenPayload["role"],
    email: payload.email as string,
  };
}

/** Verify refresh token */
export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return {
    sub: payload.sub!,
    role: payload.role as TokenPayload["role"],
    email: payload.email as string,
  };
}

/** Extract user from Authorization header */
export async function authenticate(headers: Headers): Promise<TokenPayload> {
  const authHeader = headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token no proporcionado");
  }
  const token = authHeader.slice(7);
  return verifyAccessToken(token);
}