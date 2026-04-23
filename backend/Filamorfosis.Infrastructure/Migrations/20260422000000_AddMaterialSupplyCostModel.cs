using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialSupplyCostModel : Migration
    {
        // SQLite-compatible UUID generator expression
        private const string SqliteUuid =
            "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || " +
            "substr(lower(hex(randomblob(2))),2) || '-' || " +
            "substr('89ab', abs(random()) % 4 + 1, 1) || " +
            "substr(lower(hex(randomblob(2))),2) || '-' || " +
            "lower(hex(randomblob(6)))";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1 — Create MaterialSupplyUsages table
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""MaterialSupplyUsages"" (
    ""Id"" TEXT NOT NULL DEFAULT (" + SqliteUuid + @"),
    ""MaterialId"" TEXT NOT NULL,
    ""CostParameterId"" TEXT NOT NULL,
    ""Quantity"" TEXT NOT NULL,
    CONSTRAINT ""PK_MaterialSupplyUsages"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_MaterialSupplyUsages_Materials_MaterialId"" FOREIGN KEY (""MaterialId"") REFERENCES ""Materials"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_MaterialSupplyUsages_CostParameters_CostParameterId"" FOREIGN KEY (""CostParameterId"") REFERENCES ""CostParameters"" (""Id"") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_MaterialSupplyUsages_MaterialId_CostParameterId"" ON ""MaterialSupplyUsages"" (""MaterialId"", ""CostParameterId"");
");

            // Step 1 — Create VariantMaterialUsages table
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""VariantMaterialUsages"" (
    ""Id"" TEXT NOT NULL DEFAULT (" + SqliteUuid + @"),
    ""VariantId"" TEXT NOT NULL,
    ""MaterialId"" TEXT NOT NULL,
    ""Quantity"" TEXT NOT NULL,
    CONSTRAINT ""PK_VariantMaterialUsages"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_VariantMaterialUsages_ProductVariants_VariantId"" FOREIGN KEY (""VariantId"") REFERENCES ""ProductVariants"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_VariantMaterialUsages_Materials_MaterialId"" FOREIGN KEY (""MaterialId"") REFERENCES ""Materials"" (""Id"") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_VariantMaterialUsages_VariantId_MaterialId"" ON ""VariantMaterialUsages"" (""VariantId"", ""MaterialId"");
");

            // Step 2 — Add StockQuantity to Materials
            migrationBuilder.Sql(@"ALTER TABLE ""Materials"" ADD COLUMN ""StockQuantity"" INTEGER NOT NULL DEFAULT 0;");

            // Step 3 — Migrate VariantSupplyUsages → MaterialSupplyUsages
            // SQLite does not support ON CONFLICT in INSERT...SELECT; use INSERT OR IGNORE instead
            migrationBuilder.Sql(@"
INSERT OR IGNORE INTO ""MaterialSupplyUsages"" (""Id"", ""MaterialId"", ""CostParameterId"", ""Quantity"")
SELECT
    " + SqliteUuid + @",
    pv.""MaterialId"",
    vsu.""CostParameterId"",
    SUM(vsu.""Quantity"")
FROM ""VariantSupplyUsages"" vsu
JOIN ""ProductVariants"" pv ON pv.""Id"" = vsu.""VariantId""
WHERE pv.""MaterialId"" IS NOT NULL
GROUP BY pv.""MaterialId"", vsu.""CostParameterId"";
");

            // Step 4 — Migrate ProductVariants.MaterialId → VariantMaterialUsages
            migrationBuilder.Sql(@"
INSERT OR IGNORE INTO ""VariantMaterialUsages"" (""Id"", ""VariantId"", ""MaterialId"", ""Quantity"")
SELECT " + SqliteUuid + @", ""Id"", ""MaterialId"", 1
FROM ""ProductVariants""
WHERE ""MaterialId"" IS NOT NULL;
");

            // Step 5 — Recompute Materials.BaseCost
            migrationBuilder.Sql(@"
UPDATE ""Materials""
SET ""BaseCost"" = COALESCE((
    SELECT SUM(CAST(cp.""Value"" AS REAL) * CAST(msu.""Quantity"" AS REAL))
    FROM ""MaterialSupplyUsages"" msu
    JOIN ""CostParameters"" cp ON cp.""Id"" = msu.""CostParameterId""
    WHERE msu.""MaterialId"" = ""Materials"".""Id""
), 0);
");

            // Step 6 — Drop legacy columns and table
            // SQLite does not support DROP COLUMN directly in older versions;
            // EF Core handles this via table rebuild. Use migrationBuilder helpers instead.
            migrationBuilder.DropColumn(table: "ProductVariants", name: "MaterialId");
            migrationBuilder.DropTable(name: "VariantSupplyUsages");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 1. Recreate VariantSupplyUsages table
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""VariantSupplyUsages"" (
    ""Id"" TEXT NOT NULL DEFAULT (" + SqliteUuid + @"),
    ""VariantId"" TEXT NOT NULL,
    ""CostParameterId"" TEXT NOT NULL,
    ""Quantity"" TEXT NOT NULL,
    CONSTRAINT ""PK_VariantSupplyUsages"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_VariantSupplyUsages_ProductVariants_VariantId"" FOREIGN KEY (""VariantId"") REFERENCES ""ProductVariants"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_VariantSupplyUsages_CostParameters_CostParameterId"" FOREIGN KEY (""CostParameterId"") REFERENCES ""CostParameters"" (""Id"") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_VariantSupplyUsages_VariantId_CostParameterId"" ON ""VariantSupplyUsages"" (""VariantId"", ""CostParameterId"");
");

            // 2. Add back MaterialId column to ProductVariants (nullable)
            migrationBuilder.AddColumn<string>(
                name: "MaterialId",
                table: "ProductVariants",
                type: "TEXT",
                nullable: true);

            // 3. Drop VariantMaterialUsages table
            migrationBuilder.DropTable(name: "VariantMaterialUsages");

            // 4. Drop MaterialSupplyUsages table
            migrationBuilder.DropTable(name: "MaterialSupplyUsages");

            // 5. Drop StockQuantity column from Materials
            migrationBuilder.DropColumn(table: "Materials", name: "StockQuantity");
        }
    }
}
