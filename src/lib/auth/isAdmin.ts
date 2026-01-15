// src/lib/auth/isAdmin.ts
const ADMINS = new Set([
  "mindra.group.llc@gmail.com",
  // можешь добавить запасную почту
]);

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMINS.has(String(email).toLowerCase());
}
