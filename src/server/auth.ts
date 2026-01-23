// src/server/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth-options";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) throw new Error("Unauthorized");
  return userId;
}
