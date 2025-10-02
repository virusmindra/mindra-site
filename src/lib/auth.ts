// ВРЕМЕННЫЙ стаб. Замени на реальную авторизацию позже.
export type AuthedUser = { id: string; email?: string } | null;

export async function getCurrentUser(): Promise<AuthedUser> {
  // верни пользователя из своей сессии/кук/токена
  return null; // по умолчанию — не залогинен
}
