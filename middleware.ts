import { NextResponse, type NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// CSP: deliberately permissive on inline scripts because Next 14 emits some
// inline boot. A stricter policy would require nonce wiring on every <Script>.
function csp(): string {
  return [
    "default-src 'self'",
    "img-src 'self' data: blob: https://images.unsplash.com https://i.pravatar.cc https://picsum.photos",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self' https://api.coingecko.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function middleware(req: NextRequest) {
  // CSRF defense: reject state-changing requests whose Origin doesn't match
  // the request Host. SameSite=lax already prevents most cases; this closes
  // the gap for fetch() from a malicious site.
  if (MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (!origin || !host) {
      return new NextResponse("Forbidden: missing origin", { status: 403 });
    }
    try {
      if (new URL(origin).host !== host) {
        return new NextResponse("Forbidden: cross-origin", { status: 403 });
      }
    } catch {
      return new NextResponse("Forbidden: malformed origin", { status: 403 });
    }
  }

  const res = NextResponse.next();
  res.headers.set("Content-Security-Policy", csp());
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
