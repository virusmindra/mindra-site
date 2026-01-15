/*
  Warnings:

  - You are about to drop the `Feedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "mindra"."Feedback";

-- CreateTable
CREATE TABLE "mindra"."feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "locale" TEXT,
    "userId" TEXT,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);
