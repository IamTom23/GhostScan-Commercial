@echo off
echo ========================================
echo    GhostScan Extension - CSP Fixed
echo ========================================
echo.
echo ✅ CSP Violations Fixed:
echo - Removed inline script from HTML
echo - Created separate debug-popup.js file
echo - HTML now references external script
echo.
echo Files created/updated:
echo - dist/debug-popup.js (new external script)
echo - dist/debug-popup.html (updated to use external script)
echo.
echo To test the fix:
echo 1. Go to chrome://extensions/
echo 2. Find "GhostScan Privacy Tool"
echo 3. Click the refresh/reload button
echo 4. Click the extension icon
echo.
echo Expected results:
echo ✅ No CSP violations in console
echo ✅ No "Refused to execute inline script" errors
echo ✅ Debug popup loads properly
echo ✅ All buttons work correctly
echo.
echo If you still see CSP errors:
echo 1. Make sure you refreshed the extension
echo 2. Check that debug-popup.js exists in dist folder
echo 3. Verify the script src path in HTML
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo Chrome should now be open. Test the extension!
echo.
pause 