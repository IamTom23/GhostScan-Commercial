@echo off
echo ========================================
echo    GhostScan - Connection Issue Debug
echo ========================================
echo.
echo 🔍 CURRENT STATUS:
echo - Chrome Available: ✅
echo - Runtime Available: ✅
echo - Storage Available: ❌
echo - Test Message Sent: ❌
echo - Extension Installed: ❌
echo.
echo 📋 DIAGNOSTIC STEPS:
echo.
echo 1. CHECK EXTENSION STATUS:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Make sure it's ENABLED (toggle ON)
echo    - Check for any error messages
echo    - Note the extension ID: lldnikolaejjojgiabojpfhmpaafeige
echo.
echo 2. TEST EXTENSION INDEPENDENTLY:
echo    - Click the extension icon in toolbar
echo    - Should see debug popup
echo    - Click "Test Chrome API" - should show all ✅
echo    - Click "Test Scan" - should work
echo.
echo 3. CHECK BROWSER CONSOLE:
echo    - Open DevTools (F12) on dashboard
echo    - Look for [ExtensionService] messages
echo    - Check for any error messages
echo    - Look for "Extension not detected" messages
echo.
echo 4. VERIFY DASHBOARD URL:
echo    - Make sure dashboard is on http://localhost:5175
echo    - Not on https://localhost:5175
echo    - Not on a different port
echo.
echo 5. TEST MANUAL CONNECTION:
echo    - Open browser console (F12)
echo    - Type: chrome.runtime.sendMessage({action: 'PING'}, console.log)
echo    - Should see response or error
echo.
echo ⚠️ POSSIBLE ISSUES:
echo.
echo Issue 1: Extension not enabled
echo - Solution: Enable extension in chrome://extensions/
echo.
echo Issue 2: Dashboard on wrong URL
echo - Solution: Make sure it's http://localhost:5175
echo.
echo Issue 3: Browser cache issues
echo - Solution: Hard refresh (Ctrl+F5) or clear cache
echo.
echo Issue 4: Extension communication blocked
echo - Solution: Check if any security software is blocking
echo.
echo Issue 5: Multiple Chrome instances
echo - Solution: Close all Chrome windows and restart
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After checking:
echo 1. Verify extension is enabled
echo 2. Test extension popup
echo 3. Check browser console
echo 4. Report any error messages found
echo.
pause 