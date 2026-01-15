// src/lib/auth/isAdmin.ts
export function isAdminUserId(userId: string | null | undefined) {
  const admin = process.env.ADMIN_USER_ID;
  if (!admin) return false;
  return String(userId || "") === String(admin);
}
