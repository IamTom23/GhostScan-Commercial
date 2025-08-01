@echo off
echo ========================================
echo    GhostScan - Internal Communication Test
echo ========================================
echo.
echo 🔍 ISSUE IDENTIFIED:
echo - Background script is running ✅
echo - Extension ID is correct ✅
echo - Dashboard can't send messages to extension
echo - Issue: externally_connectable permissions
echo.
echo 📋 INTERNAL COMMUNICATION TEST:
echo.
echo 1. OPEN BACKGROUND PAGE CONSOLE:
echo    - Go to chrome://extensions/
echo    - Click "Details" on GhostScan extension
echo    - Click "background page" link
echo    - Keep DevTools console open
echo.
echo 2. TEST INTERNAL MESSAGE:
echo    - In background page console, type:
echo      chrome.runtime.sendMessage({action: 'PING'}, console.log)
echo    - Should see response: {success: true, message: 'PONG'}
echo    - This tests if background script can receive messages
echo.
echo 3. TEST FROM POPUP:
echo    - Click extension icon in toolbar
echo    - Click "Test Chrome API" button
echo    - Should show all APIs available ✅
echo    - This tests if popup can communicate with background
echo.
echo 4. TEST FROM CONTENT SCRIPT:
echo    - In background page console, type:
echo      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
echo        chrome.tabs.sendMessage(tabs[0].id, {action: 'PING'}, console.log);
echo      });
echo    - Should see response from content script
echo.
echo 🔍 EXPECTED RESULTS:
echo.
echo If internal communication works:
echo - Background script responds to internal messages
echo - Popup can communicate with background
echo - Issue is specifically with dashboard communication
echo.
echo If internal communication fails:
echo - Background script doesn't respond to any messages
echo - Issue is with background script message handling
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report if background script responds to internal messages
echo 2. Report if popup communication works
echo 3. Report if content script communication works
echo.
pause 