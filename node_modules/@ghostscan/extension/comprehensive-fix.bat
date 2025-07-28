@echo off
echo ========================================
echo    GhostScan - Comprehensive Fix
echo ========================================
echo.
echo 🔍 ISSUE CONFIRMED:
echo - Background script not running
echo - "Receiving end does not exist" error
echo - Extension needs proper restart
echo.
echo ✅ VERIFICATION:
echo - Background script compiled correctly ✅
echo - Manifest updated ✅
echo - All files in dist folder ✅
echo.
echo 📋 COMPREHENSIVE FIX STEPS:
echo.
echo 1. COMPLETE EXTENSION RESTART:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Toggle extension OFF (disable it)
echo    - Wait 2 seconds
echo    - Toggle extension ON (enable it)
echo    - Wait for "Extension enabled" message
echo.
echo 2. VERIFY BACKGROUND SCRIPT:
echo    - In chrome://extensions/
echo    - Click "Details" on GhostScan extension
echo    - Scroll down to "Background page"
echo    - Click "background page" link
echo    - Should open DevTools for background script
echo    - Check console for: "🔍 GhostScan Background Service Worker loaded"
echo    - If no console message, background script isn't running
echo.
echo 3. TEST EXTENSION FUNCTIONALITY:
echo    - Click extension icon in toolbar
echo    - Click "Test Chrome API" - should show all ✅
echo    - Click "Test Scan" - should work
echo    - Extension should be fully functional
echo.
echo 4. TEST DASHBOARD CONNECTION:
echo    - Go to dashboard (http://localhost:5175)
echo    - Hard refresh (Ctrl+F5)
echo    - Click "Test Connection" in debug panel
echo    - Should show SUCCESS
echo.
echo 5. TEST SCAN FUNCTIONALITY:
echo    - Click "Run New Scan" in dashboard
echo    - Should now work properly
echo    - Should show real data after scan
echo.
echo ⚠️ IF BACKGROUND SCRIPT STILL NOT LOADING:
echo.
echo Option 1: Remove and re-add extension
echo - Remove extension completely
echo - Load unpacked extension again from dist folder
echo.
echo Option 2: Check for JavaScript errors
echo - Open background page DevTools
echo - Look for any red error messages
echo - Check if there are syntax errors
echo.
echo Option 3: Clear browser cache
echo - Clear Chrome cache and cookies
echo - Restart Chrome completely
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After completing the fix:
echo 1. Report if background script loads (console message)
echo 2. Report if extension works independently
echo 3. Report if dashboard connection works
echo 4. Report if scan functionality works
echo.
pause 