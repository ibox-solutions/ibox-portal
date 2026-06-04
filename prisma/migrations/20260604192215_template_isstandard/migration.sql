/*
  Warnings:

  - You are about to drop the column `designId` on the `Template` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_designId_fkey";

-- DropIndex
DROP INDEX "Template_productGroupId_designId_key";

-- AlterTable
ALTER TABLE "Presentation" ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "designId",
ADD COLUMN     "isStandard" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Template_productGroupId_isStandard_idx" ON "Template"("productGroupId", "isStandard");

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
