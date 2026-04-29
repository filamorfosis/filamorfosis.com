-- Manual schema migration: Remove English fields and rename ProcessCosts table
-- This script applies the changes from RemoveEnglishFieldsAndRenameProcessCosts migration

PRAGMA foreign_keys = OFF;

-- Step 1: Rename CostParameters table to ProcessesCosts
ALTER TABLE CostParameters RENAME TO ProcessesCosts;

-- Step 2: Rename CostParameterId column to ProcessCostId in MaterialSupplyUsages
ALTER TABLE MaterialSupplyUsages RENAME COLUMN CostParameterId TO ProcessCostId;

-- Step 3: Drop English fields from ProductVariants
ALTER TABLE ProductVariants DROP COLUMN PrintType;
ALTER TABLE ProductVariants DROP COLUMN WeightGrams;

-- Step 4: Drop English fields from Products
ALTER TABLE Products DROP COLUMN DescriptionEn;
ALTER TABLE Products DROP COLUMN TitleEn;

-- Step 5: Drop English fields from Processes
ALTER TABLE Processes DROP COLUMN NameEn;

-- Step 6: Drop English fields from OrderItems
ALTER TABLE OrderItems DROP COLUMN ProductTitleEn;
ALTER TABLE OrderItems DROP COLUMN VariantLabelEn;

PRAGMA foreign_keys = ON;

-- Step 7: Add migration history entry
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
VALUES ('20260429015838_RemoveEnglishFieldsAndRenameProcessCosts', '10.0.0');
