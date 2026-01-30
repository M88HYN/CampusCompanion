#!/usr/bin/env pwsh
# Simple test runner script

Write-Host "🧪 Running Authentication Tests..." -ForegroundColor Cyan
Write-Host ""

npx tsx test-username-auth.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Tests failed with exit code: $LASTEXITCODE" -ForegroundColor Red
}
