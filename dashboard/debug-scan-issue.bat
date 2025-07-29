@echo off
echo ========================================
echo    GhostScan - Scan Issue Debug
echo ========================================
echo.
echo 🔍 CURRENT ISSUE:
echo - Extension connection works ✅
echo - "Run New Scan" button doesn't work
echo - Need to identify scan trigger issue
echo.
echo 📋 DEBUGGING STEPS:
echo.
echo 1. CHECK BROWSER CONSOLE:
echo    - Open DevTools (F12) on dashboard
echo    - Look for console messages when clicking scan
echo    - Should see "Starting scan..." message
echo    - Check for any error messages
echo.
echo 2. TEST EXTENSION SCAN:
echo    - Click extension icon in toolbar
echo    - Click "Test Scan" button
echo    - Should see scan progress and results
echo    - Extension scan should work independently
echo.
echo 3. MANUAL CONSOLE TEST:
echo    - In browser console, type:
echo      extensionService.triggerExtensionScan().then(console.log)
echo    - Should trigger scan and show results
echo.
echo 4. CHECK SCAN PROGRESS:
echo    - In browser console, type:
echo      extensionService.getScanProgress().then(console.log)
echo    - Should show scan status
echo.
echo 5. VERIFY BUTTON CLICK:
echo    - Click "Run New Scan" button
echo    - Check if button shows loading state
echo    - Check if scan progress appears
echo.
echo ⚠️ POSSIBLE ISSUES:
echo.
echo Issue 1: Button click not registered
echo - Solution: Check if button has proper onClick handler
echo.
echo Issue 2: Extension scan not responding
echo - Solution: Check extension background script
echo.
echo Issue 3: Scan timeout
echo - Solution: Check if scan takes too long
echo.
echo Issue 4: Data conversion error
echo - Solution: Check scan result format
echo.
echo Press any key to continue...
pause 