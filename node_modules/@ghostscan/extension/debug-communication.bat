@echo off
echo ========================================
echo    GhostScan - Communication Debug
echo ========================================
echo.
echo ✅ BACKGROUND SCRIPT STATUS:
echo - Background script is running ✅
echo - Extension ID is correct ✅
echo - Issue: Communication between dashboard and extension
echo.
echo 📋 DEBUGGING STEPS:
echo.
echo 1. RELOAD EXTENSION:
echo    - Go to chrome://extensions/
echo    - Click "Reload" button on GhostScan extension
echo    - Wait for "Extension reloaded" message
echo.
echo 2. OPEN BACKGROUND PAGE CONSOLE:
echo    - Click "Details" on extension
echo    - Click "background page" link
echo    - Keep this DevTools window open
echo    - Console should show: "🔍 GhostScan Background Service Worker loaded"
echo.
echo 3. TEST DASHBOARD COMMUNICATION:
echo    - Go to dashboard (http://localhost:5175)
echo    - Hard refresh (Ctrl+F5)
echo    - Click "Test Connection" in debug panel
echo    - WATCH the background page console for messages
echo    - Should see: "🔍 Background received message: {action: 'PING'}"
echo.
echo 4. TEST SCAN FUNCTION:
echo    - Click "Run New Scan" in dashboard
echo    - WATCH the background page console for messages
echo    - Should see: "🔍 Background received message: {action: 'START_SCAN'}"
echo.
echo 5. MANUAL CONSOLE TEST:
echo    - In background page console, type:
echo      chrome.runtime.sendMessage({action: 'PING'}, console.log)
echo    - Should see response in console
echo.
echo 🔍 EXPECTED RESULTS:
echo.
echo If communication works:
echo - Background console shows received messages
echo - Dashboard shows "SUCCESS" responses
echo - Scan functionality works
echo.
echo If communication fails:
echo - Background console shows NO received messages
echo - Dashboard shows "Receiving end does not exist"
echo - Issue is with message routing
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report if background console shows received messages
echo 2. Report if dashboard connection works
echo 3. Report if scan functionality works
echo.
pause 