@echo off
echo ========================================
echo    GhostScan - Background Script Fix
echo ========================================
echo.
echo 🔍 ISSUE IDENTIFIED:
echo - "Could not establish connection. Receiving end does not exist."
echo - Extension background script not running
echo - Need to restart extension properly
echo.
echo 📋 FIX STEPS:
echo.
echo 1. REFRESH EXTENSION:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Click the refresh/reload button (🔄)
echo    - Wait for "Extension reloaded" message
echo.
echo 2. CHECK EXTENSION STATUS:
echo    - Make sure extension is ENABLED (toggle ON)
echo    - Check for any error messages in red
echo    - Extension should show "No errors"
echo.
echo 3. TEST EXTENSION INDEPENDENTLY:
echo    - Click extension icon in toolbar
echo    - Click "Test Chrome API" - should show all ✅
echo    - Click "Test Scan" - should work
echo    - Extension should be fully functional
echo.
echo 4. CHECK BACKGROUND SCRIPT:
echo    - In chrome://extensions/
echo    - Click "Details" on GhostScan extension
echo    - Scroll down to "Background page"
echo    - Click "background page" link
echo    - Should open DevTools for background script
echo    - Check console for any errors
echo.
echo 5. TEST DASHBOARD CONNECTION:
echo    - Go back to dashboard
echo    - Hard refresh (Ctrl+F5)
echo    - Click "Test Connection" in debug panel
echo    - Should show SUCCESS
echo.
echo 6. TEST SCAN:
echo    - Click "Run New Scan" in dashboard
echo    - Should now work properly
echo.
echo ⚠️ IF STILL NOT WORKING:
echo.
echo Option 1: Disable and re-enable extension
echo - Toggle extension OFF, then ON again
echo.
echo Option 2: Remove and re-add extension
echo - Remove extension completely
echo - Load unpacked extension again
echo.
echo Option 3: Check for errors
echo - Open background page DevTools
echo - Look for JavaScript errors
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After fixing:
echo 1. Report if extension reloaded successfully
echo 2. Report any error messages
echo 3. Report if background page loads
echo 4. Test scan functionality
echo.
pause 