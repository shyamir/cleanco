-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_INSPECTION';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "confirmedPrice" DECIMAL(10,2),
ADD COLUMN     "estimatedPrice" DECIMAL(10,2),
ADD COLUMN     "inspectedAt" TIMESTAMP(3),
ADD COLUMN     "inspectedBy" TEXT,
ADD COLUMN     "priceAdjustmentReason" TEXT,
ADD COLUMN     "squareFeet" INTEGER,
ADD COLUMN     "toilets" INTEGER;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "squareFeet" INTEGER,
ADD COLUMN     "toilets" INTEGER;

-- CreateTable
CREATE TABLE "home_pricing_rules" (
    "id" TEXT NOT NULL,
    "frequency" "SubscriptionFrequency",
    "bedrooms" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_pricing_tiers" (
    "id" TEXT NOT NULL,
    "frequency" "SubscriptionFrequency",
    "sqftMin" INTEGER NOT NULL,
    "sqftMax" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_addon_pricing" (
    "id" TEXT NOT NULL,
    "addOnType" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_addon_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "home_pricing_rules_bedrooms_idx" ON "home_pricing_rules"("bedrooms");

-- CreateIndex
CREATE UNIQUE INDEX "home_pricing_rules_frequency_bedrooms_key" ON "home_pricing_rules"("frequency", "bedrooms");

-- CreateIndex
CREATE INDEX "office_pricing_tiers_sqftMin_sqftMax_idx" ON "office_pricing_tiers"("sqftMin", "sqftMax");

-- CreateIndex
CREATE UNIQUE INDEX "office_pricing_tiers_frequency_sqftMin_sqftMax_key" ON "office_pricing_tiers"("frequency", "sqftMin", "sqftMax");

-- CreateIndex
CREATE UNIQUE INDEX "office_addon_pricing_addOnType_minQuantity_key" ON "office_addon_pricing"("addOnType", "minQuantity");
