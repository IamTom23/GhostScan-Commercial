@echo off
echo ========================================
echo GhostScan Extension Debug
echo ========================================

echo.
echo Opening debug page to troubleshoot extension connection...
echo.

start http://localhost:5178/debug-extension.html

echo.
echo Debug page opened. Follow the steps to identify the issue:
echo.
echo 1. Check Chrome APIs are available
echo 2. List all installed extensions
echo 3. Test different extension IDs
echo 4. Manually check chrome://extensions/
echo 5. Load extension if not found
echo.

pause 