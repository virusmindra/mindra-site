-- CreateTable
CREATE TABLE "mindra"."Feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "locale" TEXT,
    "userId" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
