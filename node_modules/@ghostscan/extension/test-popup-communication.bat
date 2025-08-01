@echo off
echo ========================================
echo    GhostScan - Popup Communication Test
echo ========================================
echo.
echo 🔍 ISSUE ANALYSIS:
echo - Background script initializes correctly ✅
echo - Message listeners are set up ✅
echo - Self-messaging doesn't work (service worker limitation)
echo - Need to test popup-to-background communication
echo.
echo 📋 POPUP COMMUNICATION TEST:
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
echo    - Watch for test message results
echo.
echo 3. TEST POPUP COMMUNICATION:
echo    - Click extension icon in toolbar
echo    - Should open test popup with buttons
echo    - Click "Test PING" button
echo    - Watch background page console for messages
echo    - Should see: "🔍 MESSAGE LISTENER CALLED!"
echo.
echo 4. TEST OTHER ACTIONS:
echo    - Click "Test START_SCAN" button
echo    - Click "Test TEST_CHROME_API" button
echo    - Watch background page console for responses
echo.
echo 5. CHECK POPUP RESULTS:
echo    - Popup should show success/error messages
echo    - Background console should show received messages
echo.
echo 🔍 EXPECTED RESULTS:
echo.
echo If popup communication works:
echo - Background console shows "MESSAGE LISTENER CALLED!"
echo - Popup shows success responses
echo - Background script is functional
echo - Issue is with dashboard communication only
echo.
echo If popup communication fails:
echo - Background console shows NO messages
echo - Popup shows error messages
echo - Issue is with background script message handling
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report if popup communication works
echo 2. Report if background console shows messages
echo 3. Report what popup shows for results
echo.
pause 