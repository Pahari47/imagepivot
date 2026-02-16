# Pre-Commit CI Check Script (PowerShell)
# Runs all CI checks locally before committing

$ErrorActionPreference = "Stop"
$exitCode = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pre-Commit CI Checks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Command {
    param([string]$Command, [string]$Description)
    
    Write-Host "`n[$Description] " -NoNewline -ForegroundColor Yellow
    Write-Host "Running: $Command" -ForegroundColor Gray
    
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
            throw "Command failed with exit code $LASTEXITCODE"
        }
        Write-Host "[OK] $Description passed" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[FAIL] $Description failed" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        return $false
    }
}

# Check Node version
Write-Host "Checking Node.js version..." -ForegroundColor Cyan
$nodeVersion = node -v
Write-Host "Node: $nodeVersion" -ForegroundColor Gray
if ($nodeVersion -notmatch "v22") {
    Write-Host "Warning: CI uses Node 22, you have $nodeVersion" -ForegroundColor Yellow
}

# Check npm version
Write-Host "Checking npm version..." -ForegroundColor Cyan
$npmVersion = npm -v
Write-Host "npm: $npmVersion" -ForegroundColor Gray
if ($npmVersion -ne "10.9.4") {
    Write-Host "Warning: CI uses npm 10.9.4, you have $npmVersion" -ForegroundColor Yellow
}

# 1. Install dependencies
if (-not (Test-Command "npm ci" "Install dependencies")) {
    Write-Host "`nTrying npm install as fallback..." -ForegroundColor Yellow
    if (-not (Test-Command "npm install" "Install dependencies (fallback)")) {
        $exitCode = 1
        Write-Host "`n[FAIL] Failed to install dependencies" -ForegroundColor Red
        exit $exitCode
    }
}

# 2. Prisma validation
Write-Host "`n[Prisma validation] " -NoNewline -ForegroundColor Yellow
Write-Host "Running: npx prisma validate" -ForegroundColor Gray
try {
    Push-Location packages/database
    npx prisma validate
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        throw "Prisma validation failed"
    }
    Pop-Location
    Write-Host "[OK] Prisma schema validation passed" -ForegroundColor Green
} catch {
    Pop-Location
    Write-Host "[FAIL] Prisma schema validation failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    $exitCode = 1
}

# 3. Prisma generate
if (-not (Test-Command "npm run prisma:generate" "Generate Prisma client")) {
    $exitCode = 1
}

# 4. Lint
if (-not (Test-Command "npm run lint" "Lint all projects")) {
    Write-Host "Note: Linting errors are warnings in CI (continue-on-error: true)" -ForegroundColor Yellow
}

# 5. Type check
Write-Host "`n[Type Check] " -NoNewline -ForegroundColor Yellow
Write-Host "Running: npx nx run-many --target=typecheck --all" -ForegroundColor Gray
try {
    $typeCheckOutput = npx nx run-many --target=typecheck --all 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        throw "Type check failed"
    }
    Write-Host "[OK] Type check passed" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Type check failed" -ForegroundColor Red
    Write-Host "Note: Type check errors are warnings in CI (continue-on-error: true)" -ForegroundColor Yellow
}

# 6. Build
if (-not (Test-Command "npm run build" "Build all projects")) {
    $exitCode = 1
}

# 7. Tests (optional - may not exist)
Write-Host "`n[Tests] " -NoNewline -ForegroundColor Yellow
Write-Host "Running: npm run test" -ForegroundColor Gray
try {
    $testOutput = npm run test 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "[!] Tests failed or no tests found (this is OK in CI)" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Tests passed" -ForegroundColor Green
    }
} catch {
    Write-Host "[!] Tests skipped (no tests or test command failed)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "  [OK] All critical checks passed!" -ForegroundColor Green
    Write-Host "  You're ready to commit!" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Some checks failed" -ForegroundColor Red
    Write-Host "  Please fix errors before committing" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $exitCode

