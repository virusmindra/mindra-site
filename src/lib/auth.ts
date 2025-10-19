// src/lib/auth.ts
import type { AuthedUser } from './app-auth';
import { getCurrentUser as getUserFromApp } from './app-auth';

export async function getCurrentUser(): Promise<AuthedUser> {
  return await getUserFromApp();
}

export async function getUserId() {
  const u = await getCurrentUser();
  return u?.id ?? null;
}

export async function requireUserId() {
  const id = await getUserId();
  if (!id) throw new Response('Unauthorized', { status: 401 });
  return id;
}
