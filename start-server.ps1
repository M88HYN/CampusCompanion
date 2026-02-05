#!/usr/bin/env pwsh
# Permanent fix script for starting CampusCompanion server
# This script handles port conflicts automatically

Write-Host "🚀 Starting CampusCompanion Server..." -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

# Kill any processes using port 5000 (optional - server will auto-increment if needed)
Write-Host "🔍 Checking for port conflicts..." -ForegroundColor Yellow
try {
    $processes = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "⚠️  Port 5000 is in use. The server will automatically find an available port." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Port 5000 is available" -ForegroundColor Green
    }
} catch {
    Write-Host "✅ Port 5000 appears to be available" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏃 Starting development servers..." -ForegroundColor Cyan
Write-Host ""

# Start the development server
npm run dev
