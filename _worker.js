// Cloudflare Pages Advanced Mode — _worker.js
// Handles all requests using Next.js standalone server
export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    // Set environment bindings
    if (env.JWT_SECRET) {
      (globalThis as Record<string, unknown>).__JWT_SECRET__=*** }
    if (env.REFRESH_SECRET) {
      (globalThis as Record<string, unknown>).__REFRESH_SECRET__=env.RE...T;
    }
    if (env.DB) {
      (globalThis as Record<string, unknown>).__D1__ = env.DB;
    }

    const url = new URL(request.url);
    
    // API routes
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({
        success: true,
        message: "CabanaPWA API — Cloudflare Pages",
        path: url.pathname,
        timestamp: new Date().toISOString(),
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Fallback to static assets
    return new Response('CabanaPWA is running on Cloudflare Pages', {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};
