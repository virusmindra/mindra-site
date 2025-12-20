import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth-options";

export type AuthedUser = { id: string; email?: string } | null;

export async function getCurrentUser(): Promise<AuthedUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    id: (session.user as any).id,
    email: session.user.email ?? undefined,
  };
}

export async function getUserId(): Promise<string | null> {
  const u = await getCurrentUser();
  return u?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Response("Unauthorized", { status: 401 });
  return id;
}
