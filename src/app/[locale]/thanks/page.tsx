// src/app/[locale]/thanks/page.tsx
import { auth } from '@/server/auth';

    // отключаем SSG/ISR
export const revalidate = 0;                // на всякий

export default async function ThanksPage() {
  const session = await auth();             // серверная проверка сессии
  const name = session?.user?.name ?? 'friend';

  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-semibold">Thanks, {name}!</h1>
      <p className="opacity-70">Your support means a lot 💜</p>
    </main>
  );
}
