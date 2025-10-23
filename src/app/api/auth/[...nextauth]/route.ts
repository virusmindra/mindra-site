// src/app/api/auth/[...nextauth]/route.ts
export const runtime = 'nodejs'; // важно: НЕ edge

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db";

// создаём хендлер один раз
const authHandler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  // callbacks/pages при желании
});

// и потом ЯВНО экспортируем нужные части
export const { auth } = authHandler;
export const GET = authHandler.handlers.GET;
export const POST = authHandler.handlers.POST;
