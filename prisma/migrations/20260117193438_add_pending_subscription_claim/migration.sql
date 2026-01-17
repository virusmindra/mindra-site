-- CreateTable
CREATE TABLE "mindra"."PendingSubscriptionClaim" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "emailNorm" TEXT NOT NULL,
    "anonUid" TEXT,
    "stripeCustomer" TEXT,
    "stripeSessionId" TEXT,
    "stripeSubId" TEXT,
    "plan" "mindra"."Plan" NOT NULL DEFAULT 'FREE',
    "term" TEXT,
    "status" TEXT,
    "claimedUserId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "consumed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PendingSubscriptionClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingSubscriptionClaim_stripeSessionId_key" ON "mindra"."PendingSubscriptionClaim"("stripeSessionId");

-- CreateIndex
CREATE INDEX "PendingSubscriptionClaim_emailNorm_idx" ON "mindra"."PendingSubscriptionClaim"("emailNorm");

-- CreateIndex
CREATE INDEX "PendingSubscriptionClaim_email_idx" ON "mindra"."PendingSubscriptionClaim"("email");

-- CreateIndex
CREATE INDEX "PendingSubscriptionClaim_anonUid_idx" ON "mindra"."PendingSubscriptionClaim"("anonUid");

-- CreateIndex
CREATE INDEX "PendingSubscriptionClaim_stripeCustomer_idx" ON "mindra"."PendingSubscriptionClaim"("stripeCustomer");

-- CreateIndex
CREATE INDEX "PendingSubscriptionClaim_stripeSubId_idx" ON "mindra"."PendingSubscriptionClaim"("stripeSubId");
