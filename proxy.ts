import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = session?.user as any;

  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isApi = pathname.startsWith("/api");

  // Deixa APIs passarem (proteções específicas ficam dentro das próprias APIs)
  if (isApi) return;

  // Usuário não autenticado → redireciona para /login
  if (!session && !isPublic) {
    return Response.redirect(new URL("/login", req.url));
  }

  // Usuário autenticado tentando acessar /login ou rotas auth
  if (session && isPublic && pathname !== "/api/auth/signout") {
    // Redireciona sempre todos diretamente para o dashboard
    return Response.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
