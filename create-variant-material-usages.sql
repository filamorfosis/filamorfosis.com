-- Create VariantMaterialUsages table
CREATE TABLE IF NOT EXISTS "VariantMaterialUsages" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "VariantId" TEXT NOT NULL,
    "MaterialId" TEXT NOT NULL,
    "Quantity" TEXT NOT NULL,
    CONSTRAINT "FK_VariantMaterialUsages_ProductVariants_VariantId" FOREIGN KEY ("VariantId") REFERENCES "ProductVariants" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_VariantMaterialUsages_Materials_MaterialId" FOREIGN KEY ("MaterialId") REFERENCES "Materials" ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_VariantMaterialUsages_VariantId_MaterialId" ON "VariantMaterialUsages" ("VariantId", "MaterialId");

-- Migrate ProductVariants.MaterialId → VariantMaterialUsages (if MaterialId column exists)
INSERT OR IGNORE INTO "VariantMaterialUsages" ("Id", "VariantId", "MaterialId", "Quantity")
SELECT 
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    "Id", 
    "MaterialId", 
    '1'
FROM "ProductVariants"
WHERE "MaterialId" IS NOT NULL;

-- Add migration record
INSERT OR IGNORE INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260422000000_AddMaterialSupplyCostModel', '10.0.0');
