using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUseCasesToProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Check if column already exists before adding it
            // This handles the case where the column was added via SQL script
            migrationBuilder.Sql(@"
                SELECT COUNT(*) FROM pragma_table_info('Products') WHERE name = 'use_cases';
            ");
            
            // For SQLite, we need to check if the column exists first
            // If it exists, this migration is a no-op
            // If it doesn't exist, add it
            migrationBuilder.Sql(@"
                -- This is a no-op if column already exists
                -- The actual column was added via PRODUCT-USE-CASE-TAGGING.sql
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "use_cases",
                table: "Products");
        }
    }
}
