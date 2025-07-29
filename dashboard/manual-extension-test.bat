@echo off
echo ========================================
echo    GhostScan - Manual Extension Test
echo ========================================
echo.
echo 🔍 CURRENT STATUS:
echo - Extension status shows "Test Message Sent: ✅"
echo - But PING test fails with "Receiving end does not exist"
echo - This suggests extension is partially working but background script isn't responding
echo.
echo 📋 MANUAL TESTING STEPS:
echo.
echo 1. CHECK EXTENSION IN BROWSER:
echo    - Go to chrome://extensions/
echo    - Look for "GhostScan Privacy Tool"
echo    - Check if it's ENABLED
echo    - Note the extension ID shown
echo.
echo 2. TEST EXTENSION POPUP:
echo    - Click extension icon in toolbar
echo    - Should open debug popup
echo    - Click "Test Chrome API" - should show all ✅
echo    - Click "Test Scan" - should work
echo.
echo 3. CHECK BACKGROUND SCRIPT:
echo    - In chrome://extensions/, click "Details" on extension
echo    - Click "background page" link
echo    - Should open DevTools for background script
echo    - Console should show: "🔍 GhostScan Background Service Worker loaded"
echo    - If no message, background script isn't running
echo.
echo 4. MANUAL CONSOLE TEST:
echo    - In background page DevTools console, type:
echo      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
echo        console.log('Message received:', msg);
echo        sendResponse({success: true, message: 'PONG'});
echo      });
echo    - This should add a temporary message listener
echo.
echo 5. TEST DASHBOARD CONNECTION:
echo    - Go back to dashboard
echo    - Click "Test Extension IDs" button
echo    - Should test different possible extension IDs
echo.
echo 6. VERIFY EXTENSION ID:
echo    - Compare the ID shown in chrome://extensions/
echo    - With the ID we're using: lldnikolaejjojgiabojpfhmpaafeige
echo    - If different, we need to update the dashboard
echo.
echo ⚠️ MOST LIKELY ISSUES:
echo.
echo Issue 1: Wrong extension ID
echo - The extension ID in chrome://extensions/ is different
echo - Solution: Update dashboard with correct ID
echo.
echo Issue 2: Background script not running
echo - No console message in background page
echo - Solution: Restart extension or check for errors
echo.
echo Issue 3: Extension partially loaded
echo - Popup works but background script doesn't
echo - Solution: Complete extension restart
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Report extension ID from chrome://extensions/
echo 2. Report if background script loads (console message)
echo 3. Report if extension popup works
echo 4. Report results of "Test Extension IDs" button
echo.
pause 