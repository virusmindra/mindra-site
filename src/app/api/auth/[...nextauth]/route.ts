// src/app/api/auth/[...nextauth]/route.ts
export const dynamic = 'force-dynamic'; // чтобы не кешировалось
export { handlers as GET, handlers as POST } from '@/server/auth';
