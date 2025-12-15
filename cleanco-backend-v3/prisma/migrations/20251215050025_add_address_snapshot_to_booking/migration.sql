-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "addressAddress" TEXT,
ADD COLUMN     "addressLabel" TEXT,
ADD COLUMN     "addressLandmark" TEXT,
ADD COLUMN     "addressStreet" TEXT;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
