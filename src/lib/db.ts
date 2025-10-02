// ВРЕМЕННЫЙ стаб. Подмени на Prisma/Drizzle и т.д.
type UserRecord = { stripeCustomerId?: string } | null;

export const db = {
  user: {
    async findUnique(_: { where: { id: string }, select: { stripeCustomerId: true } }): Promise<UserRecord> {
      // здесь должен быть реальный запрос в БД
      return null;
    }
  }
};
