-- AlterTable
ALTER TABLE "mindra"."user_settings" ADD COLUMN     "notify_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notify_inapp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_push" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_telegram" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pause_all" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "mindra"."notifications" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'reminder',
    "title" TEXT,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mindra"."push_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mindra"."delivery_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderId" BIGINT,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "mindra"."notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "mindra"."push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_createdAt_idx" ON "mindra"."push_subscriptions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "delivery_logs_userId_channel_createdAt_idx" ON "mindra"."delivery_logs"("userId", "channel", "createdAt");

-- CreateIndex
CREATE INDEX "delivery_logs_reminderId_createdAt_idx" ON "mindra"."delivery_logs"("reminderId", "createdAt");
