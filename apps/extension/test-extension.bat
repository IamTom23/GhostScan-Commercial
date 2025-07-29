@echo off
echo ========================================
echo    GhostScan Extension Test
echo ========================================
echo.
echo Checking extension files...
echo.

if exist "dist\manifest.json" (
    echo ✅ manifest.json - OK
) else (
    echo ❌ manifest.json - MISSING
)

if exist "dist\background.js" (
    echo ✅ background.js - OK
) else (
    echo ❌ background.js - MISSING
)

if exist "dist\content.js" (
    echo ✅ content.js - OK
) else (
    echo ❌ content.js - MISSING
)

if exist "dist\popup.html" (
    echo ✅ popup.html - OK
) else (
    echo ❌ popup.html - MISSING
)

if exist "dist\popup.css" (
    echo ✅ popup.css - OK
) else (
    echo ❌ popup.css - MISSING
)

if exist "dist\popup.js" (
    echo ✅ popup.js - OK
) else (
    echo ❌ popup.js - MISSING
)

echo.
echo Extension location:
echo %CD%\dist
echo.
echo All files are ready! Opening Chrome...
echo.
start chrome "chrome://extensions/"
echo.
echo Instructions:
echo 1. Enable "Developer mode" (top right)
echo 2. Click "Load unpacked"
echo 3. Select the dist folder above
echo 4. Click "Add extension"
echo 5. Test by clicking the extension icon!
echo.
pause 