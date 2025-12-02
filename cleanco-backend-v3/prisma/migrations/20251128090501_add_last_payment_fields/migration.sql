-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN     "lastPaymentId" TEXT;
