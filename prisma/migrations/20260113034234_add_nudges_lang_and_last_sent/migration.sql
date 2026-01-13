-- AlterTable
ALTER TABLE "mindra"."user_settings" ADD COLUMN     "lang" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "last_evening_nudge_at_utc" TIMESTAMP(3),
ADD COLUMN     "last_morning_nudge_at_utc" TIMESTAMP(3);
