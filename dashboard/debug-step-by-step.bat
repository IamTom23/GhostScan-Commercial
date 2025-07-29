@echo off
echo ========================================
echo    GhostScan - Step-by-Step Debug
echo ========================================
echo.
echo 🔍 CURRENT ISSUE:
echo - Dashboard shows "Extension not available or not installed"
echo - Extension works fine independently
echo - Need to identify communication issue
echo.
echo 📋 STEP-BY-STEP DEBUG:
echo.
echo 1. CHECK EXTENSION STATUS:
echo    - Go to chrome://extensions/
echo    - Verify "GhostScan Privacy Tool" is ENABLED
echo    - Extension ID: lldnikolaejjojgiabojpfhmpaafeige
echo    - Check for any error messages
echo.
echo 2. TEST EXTENSION INDEPENDENTLY:
echo    - Click extension icon in toolbar
echo    - Click "Test Chrome API" - should show all ✅
echo    - Click "Test Scan" - should work
echo    - Extension should be fully functional
echo.
echo 3. CHECK DASHBOARD CONSOLE:
echo    - Open DevTools (F12) on dashboard
echo    - Look for [ExtensionService] messages
echo    - Check for any error messages
echo    - Look for "Extension communication timeout"
echo.
echo 4. MANUAL CONSOLE TEST:
echo    - In browser console, type:
echo      chrome.runtime.sendMessage('lldnikolaejjojgiabojpfhmpaafeige', {action: 'PING'}, console.log)
echo    - Should see response or error
echo.
echo 5. CHECK MANIFEST PERMISSIONS:
echo    - Extension manifest should have:
echo      "externally_connectable": {"matches": ["http://localhost:*/*"]}
echo      "host_permissions": ["http://localhost:*/*"]
echo.
echo 6. VERIFY DASHBOARD URL:
echo    - Must be exactly: http://localhost:5175
echo    - Not https://localhost:5175
echo    - Not a different port
echo.
echo ⚠️ POSSIBLE ISSUES:
echo.
echo Issue 1: Extension not enabled
echo - Solution: Enable in chrome://extensions/
echo.
echo Issue 2: Wrong extension ID
echo - Solution: Verify ID in chrome://extensions/
echo.
echo Issue 3: Manifest permissions missing
echo - Solution: Check manifest.json in dist folder
echo.
echo Issue 4: Dashboard URL mismatch
echo - Solution: Ensure http://localhost:5175
echo.
echo Issue 5: Browser security blocking
echo - Solution: Check for security software
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After checking:
echo 1. Report extension status (enabled/disabled)
echo 2. Report any error messages
echo 3. Report console test results
echo 4. Report dashboard URL
echo.
pause 