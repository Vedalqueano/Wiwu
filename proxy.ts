import { NextRequest, NextResponse } from "next/server";

// Next.js 16: proxy.ts roda em Node.js runtime (não Edge).
// O wrapper auth() do NextAuth era para Edge Runtime — não funciona aqui.
// Usamos verificação otimista do cookie, conforme recomendado pelo Next.js 16.
// A segurança real fica nas API routes e server components.

const SESSION_COOKIES = [
  "__Secure-authjs.session-token", // produção (HTTPS)
  "authjs.session-token",          // desenvolvimento (HTTP)
];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApi = pathname.startsWith("/api");
  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth");

  // APIs têm proteção própria nas route handlers
  if (isApi) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));

  // Não autenticado → /login
  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Autenticado tentando acessar /login → /dashboard
  if (hasSession && isPublic && pathname !== "/api/auth/signout") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
