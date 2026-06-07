-- Countries
CREATE TABLE IF NOT EXISTS "Country" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'de',
  "flag" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Country_code_key" ON "Country"("code");

-- Teams
CREATE TABLE IF NOT EXISTS "Team" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "countryId" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Team_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE
);

-- User fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "countryId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teamId" TEXT;

-- Presentation fields
ALTER TABLE "Presentation" ADD COLUMN IF NOT EXISTS "countryId" TEXT;
ALTER TABLE "Presentation" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
ALTER TABLE "Presentation" ADD COLUMN IF NOT EXISTS "createdByEmail" TEXT;
ALTER TABLE "Presentation" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'de';

-- Seed countries
INSERT INTO "Country" ("id","code","name","language","flag") VALUES
  ('country_at','AT','Österreich','de','🇦🇹'),
  ('country_de','DE','Deutschland','de','🇩🇪'),
  ('country_ch','CH','Schweiz','de','🇨🇭')
ON CONFLICT DO NOTHING;
