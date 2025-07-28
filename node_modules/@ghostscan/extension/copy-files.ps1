# GhostScan Extension - File Copy Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GhostScan Extension File Copy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Copy manifest
Write-Host "Copying manifest.json..." -ForegroundColor Yellow
Copy-Item "manifest.json" "dist/" -Force
Write-Host "✅ manifest.json copied" -ForegroundColor Green

# Copy popup files
Write-Host "Copying popup files..." -ForegroundColor Yellow
Copy-Item "popup.html" "dist/" -Force
Copy-Item "popup.css" "dist/" -Force
Copy-Item "popup.js" "dist/" -Force
Write-Host "✅ popup files copied" -ForegroundColor Green

# Copy test files
Write-Host "Copying test files..." -ForegroundColor Yellow
Copy-Item "test-popup.html" "dist/" -Force
Copy-Item "debug-popup.html" "dist/" -Force
Write-Host "✅ test files copied" -ForegroundColor Green

# Build TypeScript files
Write-Host "Building TypeScript files..." -ForegroundColor Yellow
npm run build
Write-Host "✅ TypeScript build completed" -ForegroundColor Green

# Verify files
Write-Host ""
Write-Host "Verifying files in dist folder:" -ForegroundColor Cyan
Get-ChildItem "dist" | ForEach-Object {
    Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Extension is ready!" -ForegroundColor Green
Write-Host "Location: $((Get-Location).Path)\dist" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to chrome://extensions/" -ForegroundColor White
Write-Host "2. Enable Developer mode" -ForegroundColor White
Write-Host "3. Click 'Load unpacked'" -ForegroundColor White
Write-Host "4. Select the dist folder above" -ForegroundColor White
Write-Host "" 