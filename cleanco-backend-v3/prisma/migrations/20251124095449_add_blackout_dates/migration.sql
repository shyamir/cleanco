-- CreateTable
CREATE TABLE "blackout_dates" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blackout_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blackout_dates_date_idx" ON "blackout_dates"("date");

-- CreateIndex
CREATE UNIQUE INDEX "blackout_dates_date_key" ON "blackout_dates"("date");
