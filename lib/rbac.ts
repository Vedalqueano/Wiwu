export type UserRole = "SUPER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "VIEWER";

// Peso de cada role (maior = mais permissões)
export const ROLE_WEIGHT: Record<UserRole, number> = {
  SUPER: 5,
  ADMIN: 4,
  MANAGER: 3,
  EMPLOYEE: 2,
  VIEWER: 1,
};

// Verifica se o usuário tem ao menos o nível mínimo exigido
export function canAccess(userRole: string | undefined, minRole: UserRole): boolean {
  if (!userRole) return false;
  return (ROLE_WEIGHT[userRole as UserRole] ?? 0) >= ROLE_WEIGHT[minRole];
}

// Role mínima exigida por rota (rotas não listadas = qualquer autenticado)
export const ROUTE_MIN_ROLE: Record<string, UserRole> = {
  "/settings": "ADMIN",  // só ADMIN e SUPER
  "/admin": "ADMIN",     // Painel Admin exclusivo para gestores
  "/tasks": "EMPLOYEE",  // VIEWER não acessa
};

// Role mínima por item da sidebar (undefined = qualquer autenticado)
export const NAV_MIN_ROLE: Record<string, UserRole> = {
  "/settings": "ADMIN",
  "/admin": "ADMIN",
  "/tasks": "EMPLOYEE",
};
