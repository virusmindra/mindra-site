import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db";

export const authOptions: NextAuthOptions = {
    debug: true,
  logger: {
    error(code, metadata) {
      console.error("NEXTAUTH_ERROR", code, metadata);
    },
    warn(code) {
      console.warn("NEXTAUTH_WARN", code);
    },
    debug(code, metadata) {
      console.log("NEXTAUTH_DEBUG", code, metadata);
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      if (session?.user) (session.user as any).id = user.id;
      return session;
    },
  },
};
