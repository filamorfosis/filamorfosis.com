# Fix Migration Conflict: use_cases Column Already Exists

## Problem
The `use_cases` column was added to the Products table via the SQL script `PRODUCT-USE-CASE-TAGGING.sql`, but EF Core is trying to add it again via the migration `20260428060256_AddUseCasesToProducts`, causing a "duplicate column name" error.

## Solution Options

### Option 1: Mark Migration as Applied (Recommended)
Since the column already exists, mark the migration as applied without running it:

```bash
# Navigate to the API directory
cd backend/Filamorfosis.API

# Run the SQL script to mark the migration as applied
sqlite3 filamorfosis.db < ../mark-migration-applied.sql

# Verify it worked
sqlite3 filamorfosis.db "SELECT * FROM __EFMigrationsHistory WHERE MigrationId = '20260428060256_AddUseCasesToProducts';"
```

### Option 2: Delete and Regenerate Migration
Delete the existing migration and let EF Core detect the current state:

```bash
cd backend/Filamorfosis.API

# Remove the migration files
rm ../Filamorfosis.Infrastructure/Migrations/20260428060256_AddUseCasesToProducts.cs
rm ../Filamorfosis.Infrastructure/Migrations/20260428060256_AddUseCasesToProducts.Designer.cs

# Regenerate migration (EF Core will detect column already exists)
dotnet ef migrations add AddUseCasesToProducts

# The new migration should be empty or minimal since the column exists
```

### Option 3: Manual Database Update
Manually insert the migration record into the database:

```sql
-- Connect to your SQLite database
sqlite3 filamorfosis.db

-- Insert the migration record
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
VALUES ('20260428060256_AddUseCasesToProducts', '8.0.0');

-- Verify
SELECT * FROM __EFMigrationsHistory;

-- Exit
.quit
```

## Verification

After applying any of the above solutions, verify the setup:

```bash
cd backend/Filamorfosis.API

# Check that the column exists
sqlite3 filamorfosis.db "PRAGMA table_info(Products);" | grep use_cases

# Check that the migration is recorded
sqlite3 filamorfosis.db "SELECT * FROM __EFMigrationsHistory WHERE MigrationId LIKE '%UseCases%';"

# Try running the application
dotnet run
```

## Why This Happened

1. Task 1 ran the SQL script `PRODUCT-USE-CASE-TAGGING.sql` which added the `use_cases` column
2. Task 2.3 generated an EF Core migration that also tries to add the same column
3. When the application starts, EF Core tries to apply pending migrations, causing the conflict

## Prevention for Future

When manually running SQL scripts that modify the schema:
1. Either skip generating EF Core migrations for those changes
2. Or mark the migrations as applied immediately after running the SQL script
3. Or let EF Core handle all schema changes (don't run manual SQL scripts)

## Recommended Approach Going Forward

For this project, since the SQL script has already been run:
- Use **Option 1** (mark migration as applied)
- This preserves the migration history and prevents future conflicts
