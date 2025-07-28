@echo off
echo ========================================
echo GhostScan Extension Reload & Test
echo ========================================

echo.
echo 1. Reloading Extension in Chrome:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Click the refresh/reload button
echo    - Extension should reload with updated manifest
echo.

echo 2. Test Extension Connection:
echo    - Open: http://localhost:5178/extension-test.html
echo    - This page is served from the dashboard server
echo    - Chrome APIs will be available here
echo    - Click "Test Connection" to verify extension communication
echo.

echo 3. Test Dashboard Integration:
echo    - Open: http://localhost:5178/
echo    - Dashboard should detect extension automatically
echo    - Click "Start Scan" to test full integration
echo.

echo 4. If Extension Not Responding:
echo    - Check extension is enabled in chrome://extensions/
echo    - Verify extension ID: lldnikolaejjojgiabojpfhmpaafeige
echo    - Try reloading the extension
echo    - Check browser console for errors
echo.

echo ========================================
echo Extension ID: lldnikolaejjojgiabojpfhmpaafeige
echo Dashboard URL: http://localhost:5178/
echo Test Page: http://localhost:5178/extension-test.html
echo ========================================

echo.
echo Opening Chrome Extensions page...
start chrome://extensions/

echo.
echo Opening test page...
start http://localhost:5178/extension-test.html

echo.
echo Opening dashboard...
start http://localhost:5178/

echo.
echo Press any key to continue...
pause > nul 