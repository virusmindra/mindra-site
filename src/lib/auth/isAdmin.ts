const ADMINS = new Set([
  "mindra.group.llc@gmail.com",
].map(e => e.trim().toLowerCase()));

export function isAdminEmail(email?: string | null) {
  const e = (email || "").trim().toLowerCase();
  if (!e) return false;
  return ADMINS.has(e);
}
