using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <summary>
    /// Renames the existing 'Admin' role to 'Master' and seeds the three new
    /// granular admin roles: UserManagement, ProductManagement, OrderManagement.
    ///
    /// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
    /// </summary>
    public partial class AdminRoleManagement : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Rename Admin → Master in AspNetRoles
            migrationBuilder.Sql(@"
                UPDATE AspNetRoles
                SET Name = 'Master', NormalizedName = 'MASTER'
                WHERE NormalizedName = 'ADMIN';
            ");

            // Step 2: Seed UserManagement role if absent
            migrationBuilder.Sql(@"
                INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
                SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
                       substr(lower(hex(randomblob(2))),2) || '-' ||
                       substr('89ab', abs(random()) % 4 + 1, 1) ||
                       substr(lower(hex(randomblob(2))),2) || '-' ||
                       lower(hex(randomblob(6))),
                       'UserManagement', 'USERMANAGEMENT', lower(hex(randomblob(16)))
                WHERE NOT EXISTS (
                    SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'USERMANAGEMENT'
                );
            ");

            // Step 3: Seed ProductManagement role if absent
            migrationBuilder.Sql(@"
                INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
                SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
                       substr(lower(hex(randomblob(2))),2) || '-' ||
                       substr('89ab', abs(random()) % 4 + 1, 1) ||
                       substr(lower(hex(randomblob(2))),2) || '-' ||
                       lower(hex(randomblob(6))),
                       'ProductManagement', 'PRODUCTMANAGEMENT', lower(hex(randomblob(16)))
                WHERE NOT EXISTS (
                    SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'PRODUCTMANAGEMENT'
                );
            ");

            // Step 4: Seed OrderManagement role if absent
            migrationBuilder.Sql(@"
                INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
                SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
                       substr(lower(hex(randomblob(2))),2) || '-' ||
                       substr('89ab', abs(random()) % 4 + 1, 1) ||
                       substr(lower(hex(randomblob(2))),2) || '-' ||
                       lower(hex(randomblob(6))),
                       'OrderManagement', 'ORDERMANAGEMENT', lower(hex(randomblob(16)))
                WHERE NOT EXISTS (
                    SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'ORDERMANAGEMENT'
                );
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove the three new roles
            migrationBuilder.Sql(@"
                DELETE FROM AspNetRoles
                WHERE NormalizedName IN ('USERMANAGEMENT', 'PRODUCTMANAGEMENT', 'ORDERMANAGEMENT');
            ");

            // Rename Master back to Admin
            migrationBuilder.Sql(@"
                UPDATE AspNetRoles
                SET Name = 'Admin', NormalizedName = 'ADMIN'
                WHERE NormalizedName = 'MASTER';
            ");
        }
    }
}
