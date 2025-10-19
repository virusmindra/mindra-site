// src/lib/app-auth.ts
export type AuthedUser = { id: string; email?: string } | null;

import { cookies } from 'next/headers';

export async function getCurrentUser(): Promise<AuthedUser> {
  const jar = await cookies();
  const id = jar.get('dev-user')?.value;
  const email = jar.get('dev-email')?.value;
  if (!id) return null;
  return { id, email };
}
