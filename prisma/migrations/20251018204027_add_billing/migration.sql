-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PLUS', 'PRO');

-- CreateTable
CREATE TABLE "Subscription" (
    "userId" TEXT NOT NULL,
    "stripeCustomer" TEXT,
    "stripeSubscription" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "term" TEXT,
    "status" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "userId" TEXT NOT NULL,
    "plus" BOOLEAN NOT NULL DEFAULT false,
    "pro" BOOLEAN NOT NULL DEFAULT false,
    "tts" BOOLEAN NOT NULL DEFAULT false,
    "maxFaceTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomer_key" ON "Subscription"("stripeCustomer");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscription_key" ON "Subscription"("stripeSubscription");
