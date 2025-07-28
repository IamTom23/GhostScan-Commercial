@echo off
echo ========================================
echo GhostScan Extension ID Fix
echo ========================================

echo.
echo 1. The extension connection is failing because the extension ID is incorrect.
echo    - Current ID: lldnikolaejjojgiabojpfhmpaafeige
echo    - This might not be the actual ID of your loaded extension
echo.

echo 2. To get the correct extension ID:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Copy the extension ID shown under the extension name
echo.

echo 3. Test the extension ID:
echo    - Open: http://localhost:5178/get-extension-id.html
echo    - Enter the extension ID and test the connection
echo.

echo 4. If the connection works, update these files:
echo    - extensionService.ts
echo    - App.tsx  
echo    - extension-test.html
echo.

echo 5. Alternative: Check if extension is loaded:
echo    - Go to chrome://extensions/
echo    - Verify "GhostScan Privacy Tool" is enabled
echo    - If not loaded, click "Load unpacked" and select the dist folder
echo.

echo ========================================
echo Opening test page...
echo ========================================

start http://localhost:5178/get-extension-id.html

echo.
echo Press any key to continue...
pause > nul 