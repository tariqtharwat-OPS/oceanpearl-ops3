# OPS3 Verification Gate
# This script ensures the build, typecheck, and lint passes before any deployment or commit.

Write-Host "--- PHASING: VERIFICATION GATE ---" -ForegroundColor Cyan

Write-Host "1. Running Typecheck..." -ForegroundColor Yellow
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Typecheck failed." -ForegroundColor Red
    exit 1
}

Write-Host "2. Running Lint..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Lint failed." -ForegroundColor Red
    exit 1
}

Write-Host "3. Running Build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Build failed." -ForegroundColor Red
    exit 1
}

Write-Host "--- ALL GATES PASSED (OPS3 SECURE) ---" -ForegroundColor Green
exit 0
