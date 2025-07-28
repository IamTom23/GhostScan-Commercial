@echo off
echo ========================================
echo    GhostScan Extension - Final Test
echo ========================================
echo.
echo The extension has been updated with:
echo ✅ Simplified background script
echo ✅ Better error handling
echo ✅ Debug popup with detailed status
echo ✅ Chrome API testing
echo.
echo Extension location:
echo %CD%\dist
echo.
echo To test the extension:
echo 1. Go to chrome://extensions/
echo 2. Find "GhostScan Privacy Tool"
echo 3. Click the refresh/reload button (circular arrow)
echo 4. Click the extension icon in toolbar
echo.
echo Expected results:
echo - Debug popup should show automatically
echo - "Test Chrome API" should show available APIs
echo - "Test Scan" should run a mock scan
echo - "Test Storage" should show storage status
echo - "Open Dashboard" should open localhost:5175
echo.
echo If buttons still don't work:
echo 1. Open Chrome DevTools (F12)
echo 2. Go to Console tab
echo 3. Look for error messages
echo 4. Check if background script is loading
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo Chrome should now be open. Test the extension!
echo.
pause 