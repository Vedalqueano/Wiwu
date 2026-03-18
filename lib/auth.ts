import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "WiWU Flow",
      credentials: {
        login: { label: "E-mail ou Matrícula", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        const login = credentials.login as string;
        const password = credentials.password as string;

        // Buscar por email ou matrícula
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: login },
              { matricula: login },
            ],
          },
          include: {
            department: true,
            company: true,
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Atualizar presença
        await prisma.user.update({
          where: { id: user.id },
          data: { presence: "ONLINE", lastSeen: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role,
          initials: user.initials,
          color: user.color,
          departmentId: user.departmentId,
          departmentName: user.department?.name,
          departmentSlug: user.department?.slug,
          companyId: user.companyId,
          companyName: user.company?.name,
          onboarded: user.onboarded,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
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
      // Atualiza token com dados recebidos no update() do client
      if (trigger === "update") {
        if (session?.onboarded !== undefined) token.onboarded = session.onboarded;
        if (session?.color !== undefined) token.color = session.color;
      }
      return token;
    },
    async session({ session, token }) {
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
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
