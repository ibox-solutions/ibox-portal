-- AddColumn customerName
ALTER TABLE "Presentation" ADD COLUMN IF NOT EXISTS "customerName" TEXT;

-- AddColumn customerWebsite  
ALTER TABLE "Presentation" ADD COLUMN IF NOT EXISTS "customerWebsite" TEXT;

-- AddColumn additionalInfo
ALTER TABLE "Presentation" ADD COLUMN IF NOT EXISTS "additionalInfo" TEXT;

-- AddColumn customProductText
ALTER TABLE "Presentation" ADD COLUMN IF NOT EXISTS "customProductText" TEXT;
