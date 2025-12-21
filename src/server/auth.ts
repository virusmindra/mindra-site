import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth-options";

export async function getSession() {
  return getServerSession(authOptions);
}

/** Достаём userId (тот, что ты прокидываешь в callback session) */
export async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) throw new Error("Unauthorized");
  return userId;
}
