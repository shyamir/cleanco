-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_timeSlotId_fkey";

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "timeSlotId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "subscription_day_slots" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeSlotId" TEXT NOT NULL,

    CONSTRAINT "subscription_day_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_day_slots_subscriptionId_idx" ON "subscription_day_slots"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_day_slots_subscriptionId_dayOfWeek_key" ON "subscription_day_slots"("subscriptionId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "time_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_day_slots" ADD CONSTRAINT "subscription_day_slots_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_day_slots" ADD CONSTRAINT "subscription_day_slots_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
