#!/usr/bin/env pwsh
# Reset admin MFA secret to allow login with the seeded TOTP secret

Write-Host "Resetting admin MFA secret..." -ForegroundColor Yellow

# Path to the SQLite database
$dbPath = "Filamorfosis.API/filamorfosis.db"

if (-not (Test-Path $dbPath)) {
    Write-Host "Error: Database not found at $dbPath" -ForegroundColor Red
    exit 1
}

# Delete existing MFA secrets for admin user
$sql = @"
DELETE FROM AdminMfaSecrets 
WHERE UserId IN (SELECT Id FROM AspNetUsers WHERE Email = 'admin@filamorfosis.com');
"@

Write-Host "Deleting existing MFA secrets for admin@filamorfosis.com..." -ForegroundColor Cyan

# Execute SQL using sqlite3 command
try {
    $sql | sqlite3 $dbPath
    Write-Host "✓ MFA secrets deleted successfully" -ForegroundColor Green
} catch {
    Write-Host "Error executing SQL: $_" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Stop the API, delete the MFA records, restart
    Write-Host "Please stop the API server and run this SQL manually:" -ForegroundColor Yellow
    Write-Host $sql -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Now restart the API server. The seeder will recreate the MFA secret." -ForegroundColor Green
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Cyan
Write-Host "  Email: admin@filamorfosis.com" -ForegroundColor White
Write-Host "  Password: Admin1234!" -ForegroundColor White
Write-Host "  TOTP Secret: JBSWY3DPEHPK3PXP" -ForegroundColor White
Write-Host ""
Write-Host "Add the TOTP secret to your authenticator app (Google Authenticator, Authy, etc.)" -ForegroundColor Yellow
