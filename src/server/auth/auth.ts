import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { LoginError, authenticateCredentials } from "@/modules/auth/service";

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}
class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

function clientIp(request: Request): string {
  // Na Vercel o primeiro IP de x-forwarded-for é o do cliente (a plataforma sobrescreve o header).
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Sessões: JWT assinado/criptografado em cookie HttpOnly. O provider Credentials do Auth.js não
 * suporta sessões em banco, então a REVOGAÇÃO é feita por `User.sessionVersion`: a versão vai no
 * token e é comparada com o banco em toda requisição autenticada (ver `resolveTenantContext`).
 * O PrismaAdapter fica registrado para provedores OAuth futuros.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        try {
          return await authenticateCredentials(credentials, { ip: clientIp(request) });
        } catch (error) {
          if (error instanceof LoginError) {
            if (error.reason === "email_not_verified") throw new EmailNotVerified();
            if (error.reason === "rate_limited") throw new TooManyAttempts();
            throw new InvalidCredentials();
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.uid = user.id;
        token.sv = user.sessionVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      session.sessionVersion = token.sv ?? -1;
      return session;
    },
  },
});
