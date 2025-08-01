@echo off
echo ========================================
echo    GhostScan - Background Script Fix
echo ========================================
echo.
echo ✅ EXTENSION ID CONFIRMED:
echo - ID: lldnikolaejjojgiabojpfhmpaafeige (correct)
echo - Extension is installed and enabled
echo - Issue: Background script not running
echo.
echo 📋 BACKGROUND SCRIPT DIAGNOSIS:
echo.
echo 1. CHECK BACKGROUND SCRIPT:
echo    - Go to chrome://extensions/
echo    - Click "Details" on GhostScan extension
echo    - Click "background page" link
echo    - Should open DevTools for background script
echo    - Console should show: "🔍 GhostScan Background Service Worker loaded"
echo    - If no message, background script isn't running
echo.
echo 2. CHECK FOR ERRORS:
echo    - In background page DevTools, check Console tab
echo    - Look for any red error messages
echo    - Check for any JavaScript syntax errors
echo    - Check for any permission errors
echo.
echo 3. FORCE BACKGROUND SCRIPT RESTART:
echo    - In chrome://extensions/
echo    - Click "Reload" button on GhostScan extension
echo    - Wait for "Extension reloaded" message
echo    - Check background page console again
echo.
echo 4. COMPLETE EXTENSION RESTART:
echo    - Toggle extension OFF (disable)
echo    - Wait 2 seconds
echo    - Toggle extension ON (enable)
echo    - Check background page console
echo.
echo 5. VERIFY BACKGROUND SCRIPT:
echo    - Background page console should show:
echo      "🔍 GhostScan Background Service Worker loaded"
echo    - If still no message, there's a script error
echo.
echo ⚠️ IF BACKGROUND SCRIPT STILL NOT LOADING:
echo.
echo Option 1: Check for JavaScript errors
echo - Look for syntax errors in background page console
echo - Check if all required permissions are granted
echo.
echo Option 2: Remove and reinstall
echo - Remove extension completely
echo - Load unpacked extension again
echo.
echo Option 3: Check Chrome version
echo - Ensure Chrome is up to date
echo - Check if Manifest V3 is supported
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After checking:
echo 1. Report if background script loads (console message)
echo 2. Report any error messages in background page
echo 3. Report if reload fixes the issue
echo.
pause 