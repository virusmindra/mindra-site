// src/lib/db.ts
// ВРЕМЕННЫЙ стаб. Заменишь на Prisma/Drizzle.
export type UserRecord = { id?: string; email: string; stripeCustomerId?: string | null };

const mem = new Map<string, UserRecord>();

export const db = {
  user: {
    async findUnique({ where, select }: { where: { id?: string; email?: string }, select?: { stripeCustomerId?: true } }): Promise<UserRecord | null> {
      if (where.email) return mem.get(where.email) ?? null;
      if (where.id) {
        for (const u of mem.values()) if (u.id === where.id) return u;
      }
      return null;
    },

    async upsert({ where, update, create }: { where: { email: string }, update: Partial<UserRecord>, create: UserRecord }): Promise<UserRecord> {
      const cur = mem.get(where.email);
      if (cur) {
        const next = { ...cur, ...update };
        mem.set(where.email, next);
        return next;
      } else {
        const rec = { ...create };
        mem.set(where.email, rec);
        return rec;
      }
    },

    async update({ where, data }: { where: { email: string }, data: Partial<UserRecord> }): Promise<UserRecord> {
      const cur = mem.get(where.email) ?? { email: where.email };
      const next = { ...cur, ...data };
      mem.set(where.email, next);
      return next;
    },

    async create({ data }: { data: UserRecord }): Promise<UserRecord> {
      const rec = { ...data };
      mem.set(rec.email, rec);
      return rec;
    }
  }
};
