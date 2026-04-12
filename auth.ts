import { getServerSession, type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

import { env, isAdminEmail } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    Google({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return false;
      }

      return isAdminEmail(user.email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.email === "string") {
        session.user.email = token.email;
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
