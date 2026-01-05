-- AlterTable
ALTER TABLE "mindra"."reminders" ADD COLUMN     "snooze_until_utc" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "mindra"."user_settings" ADD COLUMN     "quiet_enabled" BOOLEAN NOT NULL DEFAULT true;
