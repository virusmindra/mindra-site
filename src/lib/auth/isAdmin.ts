export function isAdminEmail(email?: string | null) {
  const admin = process.env.ADMIN_EMAIL;
  if (!admin || !email) return false;
  return email.toLowerCase() === admin.toLowerCase();
}
