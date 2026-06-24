// Cloudflare Pages Functions — API Route Handler for /api/*
export async function onRequest(context: { request: Request; env: Record<string, unknown> }) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Set environment variables for API route handlers
  if (env.JWT_SECRET) {
    (globalThis as Record<string, unknown>).__JWT_SECRET__ = env.JWT_SECRET;
  }
  if (env.REFRESH_SECRET) {
    (globalThis as Record<string, unknown>).__REFRESH_SECRET__ = env.REFRESH_SECRET;
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Return JSON response for API health check
  // Full API implementation requires Next.js runtime on Workers
  return new Response(JSON.stringify({
    success: true,
    message: "CabanaPWA API v1 — Cloudflare Pages Functions",
    path: url.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
