-- CreateTable
CREATE TABLE "mindra"."reminders" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "due_utc" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mindra"."user_settings" (
    "userId" TEXT NOT NULL,
    "tz" TEXT NOT NULL DEFAULT 'UTC',
    "quiet_start" INTEGER NOT NULL DEFAULT 22,
    "quiet_end" INTEGER NOT NULL DEFAULT 8,
    "quiet_bypass_min" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "reminders_userId_status_due_utc_idx" ON "mindra"."reminders"("userId", "status", "due_utc");
