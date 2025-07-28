@echo off
echo ========================================
echo    GhostScan - Final Connection Test
echo ========================================
echo.
echo 🔧 UPDATES COMPLETED:
echo - Extension rebuilt with latest code
echo - Manifest updated in dist folder
echo - Extension ID fix applied to dashboard
echo - Timeout added to prevent hanging
echo.
echo 📋 TESTING STEPS:
echo.
echo 1. REFRESH EXTENSION:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Click the refresh/reload button (🔄)
echo    - Should see "Extension reloaded" message
echo.
echo 2. TEST EXTENSION INDEPENDENTLY:
echo    - Click extension icon in toolbar
echo    - Click "Test Chrome API" - should show all ✅
echo    - Click "Test Scan" - should work
echo    - Extension should be fully functional
echo.
echo 3. REFRESH DASHBOARD:
echo    - Go to http://localhost:5175
echo    - Hard refresh (Ctrl+F5)
echo    - Check console for [ExtensionService] messages
echo.
echo 4. TEST CONNECTION:
echo    - Click the 🔧 debug button in dashboard
echo    - Click "Test Connection" - should show SUCCESS
echo    - Click "Manual Test" - should show SUCCESS
echo    - Extension status should show: 🔗 Extension Connected
echo.
echo 5. TEST REAL DATA:
echo    - Click "Start Scan" in dashboard
echo    - Should trigger extension scan
echo    - Dashboard should show real data after scan
echo.
echo ✅ EXPECTED RESULTS:
echo - Extension status: 🔗 Extension Connected
echo - Test Connection: SUCCESS
echo - Manual Test: SUCCESS
echo - Real data loading from extension
echo - No more "Extension not available" messages
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report extension status in dashboard
echo 2. Report any error messages
echo 3. Report if real data is loading
echo.
pause 