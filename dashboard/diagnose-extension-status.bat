@echo off
echo ========================================
echo    GhostScan - Extension Status Diagnostic
echo ========================================
echo.
echo 🔍 CURRENT ISSUE:
echo - Background script not running
echo - "Receiving end does not exist" error persists
echo - Need to diagnose extension status
echo.
echo 📋 DIAGNOSTIC STEPS:
echo.
echo 1. CHECK EXTENSION INSTALLATION:
echo    - Go to chrome://extensions/
echo    - Look for "GhostScan Privacy Tool"
echo    - Check if it's ENABLED (toggle ON)
echo    - Check for any error messages in red
echo    - Note the extension ID shown
echo.
echo 2. VERIFY EXTENSION FILES:
echo    - Click "Details" on the extension
echo    - Check "Source" - should show the dist folder path
echo    - Check "Version" - should show 1.0.1
echo    - Check "Permissions" - should show all required permissions
echo.
echo 3. TEST BACKGROUND SCRIPT:
echo    - In extension details, click "background page" link
echo    - Should open DevTools for background script
echo    - Check console for any messages
echo    - Should see: "🔍 GhostScan Background Service Worker loaded"
echo    - If no message, background script isn't running
echo.
echo 4. CHECK FOR ERRORS:
echo    - In background page DevTools, check Console tab
echo    - Look for any red error messages
echo    - Check for any JavaScript syntax errors
echo    - Check for any permission errors
echo.
echo 5. MANUAL EXTENSION TEST:
echo    - Click extension icon in toolbar
echo    - Should open debug popup
echo    - Click "Test Chrome API" - should show all ✅
echo    - Click "Test Scan" - should work
echo.
echo 6. VERIFY EXTENSION ID:
echo    - In chrome://extensions/, note the extension ID
echo    - Should match: lldnikolaejjojgiabojpfhmpaafeige
echo    - If different, we need to update the dashboard
echo.
echo ⚠️ POSSIBLE ISSUES:
echo.
echo Issue 1: Extension not properly installed
echo - Solution: Remove and reinstall completely
echo.
echo Issue 2: Background script has errors
echo - Solution: Check background page console for errors
echo.
echo Issue 3: Wrong extension ID
echo - Solution: Update dashboard with correct ID
echo.
echo Issue 4: Permission issues
echo - Solution: Check if all permissions are granted
echo.
echo Issue 5: Chrome version compatibility
echo - Solution: Update Chrome or check compatibility
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After checking:
echo 1. Report extension status (enabled/disabled)
echo 2. Report any error messages
echo 3. Report if background script loads
echo 4. Report extension ID
echo 5. Report if extension popup works
echo.
pause 