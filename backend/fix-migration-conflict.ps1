# Fix Migration Conflict: Mark AddUseCasesToProducts as Applied
# This script marks the EF Core migration as applied without running it
# since the use_cases column was already added via SQL script

Write-Host "Fixing migration conflict..." -ForegroundColor Cyan

# Check if SQLite database exists
$dbPath = "backend/Filamorfosis.API/filamorfosis.db"
if (-not (Test-Path $dbPath)) {
    Write-Host "Error: Database file not found at $dbPath" -ForegroundColor Red
    exit 1
}

Write-Host "Database found: $dbPath" -ForegroundColor Green

# Check if use_cases column exists
Write-Host "`nChecking if use_cases column exists..." -ForegroundColor Cyan
$checkColumn = "SELECT COUNT(*) FROM pragma_table_info('Products') WHERE name = 'use_cases';"
$columnExists = sqlite3 $dbPath $checkColumn

if ($columnExists -eq "1") {
    Write-Host "✓ use_cases column exists" -ForegroundColor Green
} else {
    Write-Host "✗ use_cases column does NOT exist" -ForegroundColor Red
    Write-Host "Please run PRODUCT-USE-CASE-TAGGING.sql first" -ForegroundColor Yellow
    exit 1
}

# Check if migration is already applied
Write-Host "`nChecking if migration is already applied..." -ForegroundColor Cyan
$checkMigration = "SELECT COUNT(*) FROM __EFMigrationsHistory WHERE MigrationId = '20260428060256_AddUseCasesToProducts';"
$migrationExists = sqlite3 $dbPath $checkMigration

if ($migrationExists -eq "1") {
    Write-Host "✓ Migration already marked as applied" -ForegroundColor Green
    Write-Host "`nNo action needed. You can now run the application." -ForegroundColor Cyan
    exit 0
}

# Mark migration as applied
Write-Host "`nMarking migration as applied..." -ForegroundColor Cyan
$insertMigration = "INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260428060256_AddUseCasesToProducts', '8.0.0');"
sqlite3 $dbPath $insertMigration

# Verify
$verifyMigration = "SELECT MigrationId, ProductVersion FROM __EFMigrationsHistory WHERE MigrationId = '20260428060256_AddUseCasesToProducts';"
$result = sqlite3 $dbPath $verifyMigration

if ($result) {
    Write-Host "✓ Migration successfully marked as applied" -ForegroundColor Green
    Write-Host "`nMigration details:" -ForegroundColor Cyan
    Write-Host $result
    Write-Host "`n✓ Fix complete! You can now run the application." -ForegroundColor Green
} else {
    Write-Host "✗ Failed to mark migration as applied" -ForegroundColor Red
    exit 1
}
