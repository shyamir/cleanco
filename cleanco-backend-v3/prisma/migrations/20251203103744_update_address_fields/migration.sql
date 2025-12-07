/*
  Warnings:

  - You are about to drop the column `city` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `island` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `streetAddress` on the `addresses` table. All the data in the column will be lost.
  - Added the required column `address` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `landmark` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zoneId` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "city",
DROP COLUMN "island",
DROP COLUMN "postalCode",
DROP COLUMN "streetAddress",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "landmark" TEXT NOT NULL,
ADD COLUMN     "street" TEXT NOT NULL,
ADD COLUMN     "zoneId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "addresses_zoneId_idx" ON "addresses"("zoneId");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
