@echo off
echo ========================================
echo    GhostScan Extension Fix
echo ========================================
echo.
echo The extension should now work with a test popup.
echo.
echo Steps to fix:
echo 1. Go to chrome://extensions/
echo 2. Find GhostScan extension
echo 3. Click the refresh/reload button (circular arrow)
echo 4. OR remove and reload the extension
echo.
echo Test popup should show:
echo - Ghost emoji
echo - "GhostScan Test" title
echo - Two buttons: "Test Scan" and "Open Dashboard"
echo.
echo If you still see the manifest.json content:
echo 1. Remove the extension completely
echo 2. Clear browser cache
echo 3. Reload the extension
echo.
echo Extension location:
echo %CD%\dist
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/" 