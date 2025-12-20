import { auth } from "@/server/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  return { id: (session.user as any).id, email: session.user.email ?? undefined };
}
