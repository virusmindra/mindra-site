// Универсальный роут для next-auth v4 и v5
export const runtime = 'nodejs';

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/server/db';

const config = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async session({ session, user }: any) {
      if (session?.user) (session.user as any).id = user.id;
      return session;
    },
  },
} as const;

// В v5: NextAuth(config) возвращает объект с { handlers: { GET, POST }, ... }
// В v4: NextAuth(config) возвращает сам handler-функцию (которую можно экспортировать как GET/POST)
const anyAuth: any = (NextAuth as any)(config);

// Нормализуем экспорт под обе версии
export const GET = anyAuth.GET ?? anyAuth.handlers?.GET ?? anyAuth;
export const POST = anyAuth.POST ?? anyAuth.handlers?.POST ?? anyAuth;
