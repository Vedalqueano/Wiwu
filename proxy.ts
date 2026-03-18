import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ROUTE_MIN_ROLE, canAccess } from "@/lib/rbac";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Rotas públicas: login, todas as APIs, e assets
  const publicPaths = ["/login", "/api/"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  // Se não autenticado, redirecionar para login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = req.auth.user as any;
  const role = user?.role as string | undefined;
  const onboarded = user?.onboarded as boolean | undefined;

  // Onboarding: redirecionar novos usuários
  if (!onboarded && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }
  if (onboarded && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // RBAC: verificar role mínima por rota
  const matchedRoute = Object.keys(ROUTE_MIN_ROLE).find(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  if (matchedRoute && !canAccess(role, ROUTE_MIN_ROLE[matchedRoute])) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  // Proteção por departamento: rotas /departments/{slug} só acessíveis
  // ao membro do departamento, SUPER ou ADMIN
  const deptRouteMatch = pathname.match(/^\/departments\/([^/]+)/);
  if (deptRouteMatch) {
    const routeSlug = deptRouteMatch[1];
    const userDeptSlug = (user as any)?.departmentSlug as string | undefined;
    const isGlobal = role === "SUPER" || role === "ADMIN";
    if (!isGlobal && userDeptSlug !== routeSlug) {
      // Redireciona para o próprio departamento ou para a lista geral
      const fallback = userDeptSlug ? `/departments/${userDeptSlug}` : "/departments";
      return NextResponse.redirect(new URL(fallback, req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
