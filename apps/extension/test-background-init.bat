@echo off
echo ========================================
echo    GhostScan - Background Script Init Test
echo ========================================
echo.
echo 🔍 ISSUE IDENTIFIED:
echo - Background script is running but not responding to messages
echo - Even internal communication fails
echo - Issue: Background script initialization problem
echo.
echo 📋 INITIALIZATION TEST:
echo.
echo 1. RELOAD EXTENSION:
echo    - Go to chrome://extensions/
echo    - Click "Reload" button on GhostScan extension
echo    - Wait for "Extension reloaded" message
echo.
echo 2. CHECK BACKGROUND SCRIPT INITIALIZATION:
echo    - Click "Details" on extension
echo    - Click "background page" link
echo    - Check console for initialization messages:
echo      "🔍 GhostScan Background Service Worker loaded"
echo      "🔍 GhostScanBackground constructor called"
echo      "🔍 Initializing listeners..."
echo      "🔍 Setting up message listener..."
echo      "🔍 Message listener set up successfully"
echo      "🔍 GhostScanBackground initialization complete"
echo.
echo 3. TEST MESSAGE LISTENER:
echo    - In background page console, type:
echo      chrome.runtime.sendMessage({action: 'PING'}, console.log)
echo    - Should see response: {success: true, message: 'PONG'}
echo.
echo 4. CHECK FOR ERRORS:
echo    - Look for any red error messages in console
echo    - Check if all initialization messages appear
echo    - Check if message listener is working
echo.
echo 🔍 EXPECTED RESULTS:
echo.
echo If initialization works:
echo - All initialization messages appear in console
echo - Message listener responds to PING
echo - Background script is fully functional
echo.
echo If initialization fails:
echo - Missing initialization messages
echo - Error messages in console
echo - Message listener doesn't work
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report which initialization messages appear
echo 2. Report any error messages
echo 3. Report if message listener works
echo.
pause 