-- AlterTable
ALTER TABLE "mindra"."UserProfile" ADD COLUMN     "about" TEXT,
ADD COLUMN     "style" TEXT;

-- CreateTable
CREATE TABLE "mindra"."MemoryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "salience" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryItem_userId_kind_idx" ON "mindra"."MemoryItem"("userId", "kind");
