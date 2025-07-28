@echo off
echo ========================================
echo    GhostScan - Enhanced Listeners Test
echo ========================================
echo.
echo 🔍 BACKGROUND SCRIPT STATUS:
echo - Background script initializes correctly ✅
echo - Message listeners are being set up ✅
echo - Issue: Message listeners not being called
echo.
echo 📋 ENHANCED LISTENER TEST:
echo.
echo 1. RELOAD EXTENSION:
echo    - Go to chrome://extensions/
echo    - Click "Reload" button on GhostScan extension
echo    - Wait for "Extension reloaded" message
echo.
echo 2. CHECK BACKGROUND SCRIPT:
echo    - Click "Details" on extension
echo    - Click "background page" link
echo    - Check console for initialization messages
echo    - Should see all initialization messages
echo.
echo 3. TEST MESSAGE LISTENERS:
echo    - In background page console, type:
echo      chrome.runtime.sendMessage({action: 'PING'}, console.log)
echo    - WATCH for these messages:
echo      "🔍 MESSAGE LISTENER CALLED!"
echo      "🔍 SIMPLE TEST LISTENER CALLED!"
echo      "🔍 PING received in simple listener"
echo.
echo 4. CHECK RESPONSE:
echo    - Should see response: {success: true, message: 'PONG from simple listener'}
echo    - If no response, message listeners aren't working
echo.
echo 5. TEST DASHBOARD COMMUNICATION:
echo    - Go to dashboard (http://localhost:5175)
echo    - Click "Test Connection" in debug panel
echo    - WATCH background page console for messages
echo    - Should see listener messages
echo.
echo 🔍 EXPECTED RESULTS:
echo.
echo If listeners work:
echo - Background console shows "MESSAGE LISTENER CALLED!"
echo - PING test returns response
echo - Dashboard communication works
echo.
echo If listeners still don't work:
echo - No "MESSAGE LISTENER CALLED!" messages
echo - Still get "Receiving end does not exist"
echo - Issue is with service worker message handling
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report if message listener messages appear
echo 2. Report if PING test returns response
echo 3. Report if dashboard communication works
echo.
pause 