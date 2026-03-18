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

  // Usuário autenticado tentando acessar /login
  if (session && pathname === "/login") {
    const isAdmin = user?.role === "SUPER" || user?.role === "ADMIN";
    const onboarded = user?.onboarded;

    if (!onboarded && !isAdmin) {
      return Response.redirect(new URL("/onboarding", req.url));
    }
    return Response.redirect(new URL("/dashboard", req.url));
  }

  // Usuário autenticado em /onboarding
  if (session && isOnboarding) {
    const isAdmin = user?.role === "SUPER" || user?.role === "ADMIN";
    const onboarded = user?.onboarded;

    // ADMIN/SUPER pulam onboarding → vão direto para o dashboard
    if (isAdmin) {
      return Response.redirect(new URL("/dashboard", req.url));
    }
    // Já completou o onboarding → dashboard
    if (onboarded) {
      return Response.redirect(new URL("/dashboard", req.url));
    }
    return;
  }

  // Usuário autenticado em rotas do app (ex: /dashboard, /tasks, etc.)
  if (session && !isPublic && !isOnboarding) {
    const isAdmin = user?.role === "SUPER" || user?.role === "ADMIN";
    const onboarded = user?.onboarded;

    // Funcionário sem onboarding concluído → força onboarding
    if (!onboarded && !isAdmin) {
      return Response.redirect(new URL("/onboarding", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
