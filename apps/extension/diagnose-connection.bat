@echo off
echo ========================================
echo    GhostScan Extension - Connection Diagnostic
echo ========================================
echo.
echo 🔍 DIAGNOSTIC STEPS:
echo.
echo 1. CHECKING EXTENSION FILES:
echo    - Looking for required files in dist folder...
echo.
if exist "dist\manifest.json" (
    echo    ✅ manifest.json found
) else (
    echo    ❌ manifest.json missing
)

if exist "dist\background.js" (
    echo    ✅ background.js found
) else (
    echo    ❌ background.js missing
)

if exist "dist\content.js" (
    echo    ✅ content.js found
) else (
    echo    ❌ content.js missing
)

if exist "dist\debug-popup.html" (
    echo    ✅ debug-popup.html found
) else (
    echo    ❌ debug-popup.html missing
)

if exist "dist\debug-popup.js" (
    echo    ✅ debug-popup.js found
) else (
    echo    ❌ debug-popup.js missing
)

echo.
echo 2. CHECKING MANIFEST PERMISSIONS:
echo    - Opening manifest.json to verify permissions...
echo.
type dist\manifest.json | findstr "history"
type dist\manifest.json | findstr "externally_connectable"
echo.
echo 3. EXTENSION REFRESH INSTRUCTIONS:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Click the refresh/reload button
echo    - Wait for it to reload completely
echo    - Check if there are any error messages
echo.
echo 4. TESTING STEPS:
echo    - Click the extension icon in toolbar
echo    - Should see debug popup
echo    - Click "Test Chrome API" button
echo    - Should show all APIs as available
echo    - Click "Test Scan" button
echo    - Should complete without errors
echo.
echo 5. DASHBOARD TESTING:
echo    - Open dashboard at http://localhost:5175
echo    - Click the 🔧 debug button
echo    - All items should show ✅
echo    - Click "Test Connection" should show SUCCESS
echo.
echo ⚠️ COMMON ISSUES:
echo    - Extension not refreshed after manifest changes
echo    - Extension disabled in chrome://extensions/
echo    - Dashboard not running on localhost:5175
echo    - Browser cache issues
echo.
echo Press any key to open Chrome extensions for manual check...
pause
start chrome "chrome://extensions/"
echo.
echo After checking extensions:
echo 1. Look for any error messages on the extension
echo 2. Make sure it's enabled (toggle is ON)
echo 3. Click refresh if needed
echo 4. Test the extension popup
echo 5. Then test the dashboard connection
echo.
pause 