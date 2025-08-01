@echo off
echo ========================================
echo    GhostScan - Simple Communication Test
echo ========================================
echo.
echo 🔍 CSP ISSUE IDENTIFIED:
echo - Test popup has CSP violation
echo - Need to test communication differently
echo - Let's test from background page console directly
echo.
echo 📋 SIMPLE COMMUNICATION TEST:
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
echo.
echo 3. WAIT FOR TEST MESSAGE:
echo    - Background script will send a test message to itself after 1 second
echo    - Watch for: "🔍 Sending test message to self..."
echo    - Watch for: "🔍 Test message response:" or "🔍 Test message error:"
echo.
echo 4. TEST FROM CONTENT SCRIPT:
echo    - Open any webpage (like google.com)
echo    - Open DevTools console on that page
echo    - Type: chrome.runtime.sendMessage({action: 'PING'}, console.log)
echo    - Should send message from content script to background
echo.
echo 5. CHECK BACKGROUND CONSOLE:
echo    - Go back to background page console
echo    - Should see: "🔍 MESSAGE LISTENER CALLED!"
echo    - Should see received message details
echo.
echo 🔍 EXPECTED RESULTS:
echo.
echo If communication works:
echo - Background console shows received messages
echo - Test message from content script works
echo - Background script is functional
echo - Issue is with dashboard communication only
echo.
echo If communication fails:
echo - No messages received in background console
echo - Background script has fundamental issue
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report if test message from background works
echo 2. Report if content script communication works
echo 3. Report what you see in background console
echo.
pause 