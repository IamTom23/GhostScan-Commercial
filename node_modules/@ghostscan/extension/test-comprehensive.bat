@echo off
echo ========================================
echo    GhostScan - Comprehensive Connection Test
echo ========================================
echo.
echo 🔍 STEP-BY-STEP TESTING:
echo.
echo 1. VERIFYING FILES:
echo    Checking all required files exist...
echo.
dir dist\*.json
dir dist\*.js
dir dist\*.html
echo.
echo 2. EXTENSION REFRESH REQUIRED:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Click refresh button (circular arrow)
echo    - Wait for reload to complete
echo    - Check for any error messages
echo.
echo 3. EXTENSION POPUP TEST:
echo    - Click extension icon in toolbar
echo    - Should see debug popup
echo    - Click "Test Chrome API" button
echo    - All APIs should show ✅
echo    - Click "Test Scan" button
echo    - Should complete without errors
echo.
echo 4. DASHBOARD CONNECTION TEST:
echo    - Open http://localhost:5175
echo    - Click 🔧 debug button
echo    - Check all status items
echo    - Click "Test Connection" button
echo    - Should show "SUCCESS" with PING/PONG test
echo.
echo 5. CONSOLE DEBUGGING:
echo    - Open DevTools (F12) on dashboard
echo    - Look for [ExtensionService] messages
echo    - Check for any error messages
echo    - Look for PING/PONG test results
echo.
echo ⚠️ TROUBLESHOOTING:
echo.
echo If extension popup doesn't work:
echo - Check chrome://extensions/ for errors
echo - Make sure extension is enabled
echo - Try removing and re-adding extension
echo.
echo If dashboard shows "Extension Unavailable":
echo - Check if dashboard is running on localhost:5175
echo - Verify extension is refreshed
echo - Check browser console for errors
echo.
echo If PING test fails:
echo - Extension background script not responding
echo - Check manifest.json permissions
echo - Verify background.js is loaded
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After testing:
echo 1. Note any error messages
echo 2. Check console logs
echo 3. Report specific issues found
echo.
pause 