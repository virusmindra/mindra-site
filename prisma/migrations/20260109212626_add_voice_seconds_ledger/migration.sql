-- CreateEnum
CREATE TYPE "mindra"."VoiceUsageType" AS ENUM ('TTS_CHAT', 'FACE_CALL');

-- CreateEnum
CREATE TYPE "mindra"."BillingEventType" AS ENUM ('SUBSCRIPTION_RENEW', 'SUBSCRIPTION_CHANGE', 'TOPUP', 'MANUAL_ADJUST');

-- AlterTable
ALTER TABLE "mindra"."Entitlement" ADD COLUMN     "dailyLimitEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dailyLimitSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailySecondsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyUsedAtDate" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "voiceSecondsTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "voiceSecondsUsed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "mindra"."VoiceLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "mindra"."VoiceUsageType" NOT NULL,
    "seconds" INTEGER NOT NULL,
    "sessionId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mindra"."BillingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "mindra"."BillingEventType" NOT NULL,
    "planFrom" "mindra"."Plan",
    "planTo" "mindra"."Plan",
    "secondsAdded" INTEGER NOT NULL DEFAULT 0,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeEventId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceLedger_userId_createdAt_idx" ON "mindra"."VoiceLedger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_stripeEventId_key" ON "mindra"."BillingEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "BillingEvent_userId_createdAt_idx" ON "mindra"."BillingEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "mindra"."VoiceLedger" ADD CONSTRAINT "VoiceLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mindra"."Entitlement"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mindra"."BillingEvent" ADD CONSTRAINT "BillingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mindra"."Entitlement"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
