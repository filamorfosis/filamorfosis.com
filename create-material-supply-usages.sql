-- Create MaterialSupplyUsages table
CREATE TABLE IF NOT EXISTS "MaterialSupplyUsages" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "MaterialId" TEXT NOT NULL,
    "CostParameterId" TEXT NOT NULL,
    "Quantity" TEXT NOT NULL,
    CONSTRAINT "FK_MaterialSupplyUsages_Materials_MaterialId" FOREIGN KEY ("MaterialId") REFERENCES "Materials" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_MaterialSupplyUsages_CostParameters_CostParameterId" FOREIGN KEY ("CostParameterId") REFERENCES "CostParameters" ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_MaterialSupplyUsages_MaterialId_CostParameterId" ON "MaterialSupplyUsages" ("MaterialId", "CostParameterId");

-- Add StockQuantity column to Materials if it doesn't exist
-- SQLite doesn't support IF NOT EXISTS for columns, so we'll try and ignore errors
-- This will fail silently if the column already exists
