-- Add missing columns to Materials table

-- Add DepthCm column
ALTER TABLE "Materials" ADD COLUMN "DepthCm" TEXT;

-- Add ProcessId column (nullable first, we'll update it after)
ALTER TABLE "Materials" ADD COLUMN "ProcessId" TEXT;

-- Add ManualBaseCost column
ALTER TABLE "Materials" ADD COLUMN "ManualBaseCost" TEXT NOT NULL DEFAULT '0';

-- Add StockQuantity column (if not already added)
ALTER TABLE "Materials" ADD COLUMN "StockQuantity" INTEGER NOT NULL DEFAULT 0;

-- Update ProcessId to point to the first process for all existing materials
UPDATE "Materials" SET "ProcessId" = (SELECT "Id" FROM "Processes" LIMIT 1) WHERE "ProcessId" IS NULL;

-- Create foreign key index for ProcessId
CREATE INDEX IF NOT EXISTS "IX_Materials_ProcessId" ON "Materials" ("ProcessId");
