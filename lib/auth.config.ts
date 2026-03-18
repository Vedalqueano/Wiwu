import type { NextAuthConfig } from "next-auth";

// Configuração edge-compatible (sem Prisma) — usada pelo middleware
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.initials = (user as any).initials;
        token.color = (user as any).color;
        token.departmentId = (user as any).departmentId;
        token.departmentName = (user as any).departmentName;
        token.departmentSlug = (user as any).departmentSlug;
        token.companyId = (user as any).companyId;
        token.companyName = (user as any).companyName;
        token.onboarded = (user as any).onboarded;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).initials = token.initials;
        (session.user as any).color = token.color;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).departmentName = token.departmentName;
        (session.user as any).departmentSlug = token.departmentSlug;
        (session.user as any).companyId = token.companyId;
        (session.user as any).companyName = token.companyName;
        (session.user as any).onboarded = token.onboarded;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
