/*
  Warnings:

  - You are about to drop the column `industryCategoryId` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `isCustom` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `productVersionId` on the `Template` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productGroupId,designId]` on the table `Template` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productGroupId` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_industryCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_productVersionId_fkey";

-- DropIndex
DROP INDEX "Template_productVersionId_industryCategoryId_designId_key";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "industryCategoryId",
DROP COLUMN "isCustom",
DROP COLUMN "productVersionId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "productGroupId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Template_productGroupId_designId_key" ON "Template"("productGroupId", "designId");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "ProductGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
