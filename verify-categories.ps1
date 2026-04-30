# Category System Verification Script
# This script verifies that the category system is working correctly

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Filamorfosis Category System Verification" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Check if backend is running
Write-Host "[1/5] Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5205/api/v1/categories" -Method GET -UseBasicParsing -ErrorAction Stop 2>$null
    Write-Host "  ✗ Backend requires authentication (expected)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  ✓ Backend is running on http://localhost:5205" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Backend is not running or not responding" -ForegroundColor Red
        Write-Host "  Please start the backend with: cd backend/Filamorfosis.API && dotnet run" -ForegroundColor Yellow
        exit 1
    }
}
Write-Host ""

# 2. Check database file exists
Write-Host "[2/5] Checking database file..." -ForegroundColor Yellow
$dbPath = "backend/Filamorfosis.API/filamorfosis.db"
if (Test-Path $dbPath) {
    Write-Host "  ✓ Database file exists: $dbPath" -ForegroundColor Green
} else {
    Write-Host "  ✗ Database file not found: $dbPath" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Verify categories in database
Write-Host "[3/5] Verifying categories in database..." -ForegroundColor Yellow
$categories = sqlite3 "$dbPath" "SELECT Name, Icon FROM ProductCategories;" 2>$null
if ($categories) {
    Write-Host "  ✓ Found categories in database:" -ForegroundColor Green
    $categories | ForEach-Object {
        Write-Host "    $_" -ForegroundColor White
    }
} else {
    Write-Host "  ✗ No categories found in database" -ForegroundColor Red
    Write-Host "  Note: sqlite3 command may not be available" -ForegroundColor Yellow
}
Write-Host ""

# 4. Check frontend files
Write-Host "[4/5] Checking frontend files..." -ForegroundColor Yellow
$files = @(
    "admin.html",
    "assets/js/admin-categories.js",
    "assets/js/admin-api.js",
    "assets/css/admin.css"
)
$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (missing)" -ForegroundColor Red
        $allExist = $false
    }
}
Write-Host ""

# 5. Check modal structure in admin.html
Write-Host "[5/5] Checking modal structure..." -ForegroundColor Yellow
$adminHtml = Get-Content "admin.html" -Raw
if ($adminHtml -match 'Agregar Subcategoría') {
    Write-Host "  ✓ 'Agregar Subcategoría' button found in admin.html" -ForegroundColor Green
} else {
    Write-Host "  ✗ 'Agregar Subcategoría' button not found" -ForegroundColor Red
}

if ($adminHtml -match 'id="subcategories-list"') {
    Write-Host "  ✓ Subcategories list container found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Subcategories list container not found" -ForegroundColor Red
}

if ($adminHtml -match 'AdminCategories\._addSubCategoryRow') {
    Write-Host "  ✓ Add subcategory function reference found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Add subcategory function reference not found" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Verification Complete!" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:5205/admin.html in your browser" -ForegroundColor White
Write-Host "2. Login with admin credentials" -ForegroundColor White
Write-Host "3. Click on 'Categorías de Producto' tab" -ForegroundColor White
Write-Host "4. Click 'Editar' on any category" -ForegroundColor White
Write-Host "5. Verify the 'Agregar Subcategoría' button is visible" -ForegroundColor White
Write-Host ""
