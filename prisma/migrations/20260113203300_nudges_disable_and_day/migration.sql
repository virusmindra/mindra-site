-- AlterTable
ALTER TABLE "mindra"."user_settings" ADD COLUMN     "last_day_nudge_at_utc" TIMESTAMP(3),
ADD COLUMN     "nudges_disabled" BOOLEAN NOT NULL DEFAULT false;
