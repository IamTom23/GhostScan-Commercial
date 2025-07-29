@echo off
echo ========================================
echo GhostScan Extension Loader
echo ========================================

echo.
echo 1. Opening Chrome Extensions Page...
echo    - This will open chrome://extensions/ in your default browser
echo    - If it doesn't open automatically, manually go to: chrome://extensions/
echo.

echo 2. Enable Developer Mode:
echo    - Toggle "Developer mode" in the top right corner
echo    - This will show additional options
echo.

echo 3. Load Extension:
echo    - Click "Load unpacked" button
echo    - Navigate to: %CD%\dist
echo    - Select the dist folder and click "Select Folder"
echo.

echo 4. Verify Installation:
echo    - You should see "GhostScan Privacy Tool" in the extensions list
echo    - The extension should show as "Enabled"
echo    - Note the extension ID (should be: lldnikolaejjojgiabojpfhmpaafeige)
echo.

echo 5. Test Extension:
echo    - Click the extension icon in Chrome toolbar
echo    - You should see the popup interface
echo    - Test the "Start Scan" functionality
echo.

echo 6. Test Dashboard Connection:
echo    - Open the test page: file:///%CD%/test-connection.html
echo    - Or start the dashboard and test from there
echo.

echo ========================================
echo Extension Path: %CD%\dist
echo ========================================

echo.
echo Opening Chrome Extensions page...
start chrome://extensions/

echo.
echo Opening test connection page...
start "" "file:///%CD%/test-connection.html"

echo.
echo Press any key to continue...
pause > nul 