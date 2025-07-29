@echo off
echo ========================================
echo    GhostScan - Dashboard Communication Test
echo ========================================
echo.
echo 🔧 UPDATES APPLIED:
echo - Enhanced background script logging ✅
echo - Updated manifest with specific ports ✅
echo - Added more detailed externally_connectable rules ✅
echo.
echo 📋 TESTING STEPS:
echo.
echo 1. RELOAD EXTENSION:
echo    - Go to chrome://extensions/
echo    - Click "Reload" button on GhostScan extension
echo    - Wait for "Extension reloaded" message
echo.
echo 2. OPEN BACKGROUND PAGE CONSOLE:
echo    - Click "Details" on extension
echo    - Click "background page" link
echo    - Keep DevTools console open
echo    - Should see: "🔍 GhostScan Background Service Worker loaded"
echo.
echo 3. TEST INTERNAL COMMUNICATION:
echo    - In background page console, type:
echo      chrome.runtime.sendMessage({action: 'PING'}, console.log)
echo    - Should see response: {success: true, message: 'PONG'}
echo    - This verifies background script works internally
echo.
echo 4. TEST DASHBOARD COMMUNICATION:
echo    - Go to dashboard (http://localhost:5175)
echo    - Hard refresh (Ctrl+F5)
echo    - Click "Test Connection" in debug panel
echo    - WATCH background page console for messages
echo    - Should see: "🔍 Background received message: {action: 'PING'}"
echo.
echo 5. TEST SCAN FUNCTION:
echo    - Click "Run New Scan" in dashboard
echo    - WATCH background page console for messages
echo    - Should see: "🔍 Background received message: {action: 'START_SCAN'}"
echo.
echo 🔍 EXPECTED RESULTS:
echo.
echo If communication works:
echo - Background console shows received messages from dashboard
echo - Dashboard shows "SUCCESS" responses
echo - Scan functionality works
echo - Extension status shows "🔗 Extension Connected"
echo.
echo If communication still fails:
echo - Background console shows NO messages from dashboard
echo - Dashboard shows "Receiving end does not exist"
echo - Issue is with externally_connectable permissions
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report if background console shows dashboard messages
echo 2. Report if dashboard connection works
echo 3. Report if scan functionality works
echo.
pause 