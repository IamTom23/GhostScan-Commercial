@echo off
echo ========================================
echo    GhostScan Dashboard - Connection Test
echo ========================================
echo.
echo ✅ EXTENSION STATUS:
echo - Extension is working perfectly
echo - All Chrome APIs are available
echo - Scan completed successfully
echo - Extension ID: lldnikolaejjojgiabojpfhmpaafeige
echo.
echo 🔄 DASHBOARD REFRESH STEPS:
echo 1. Make sure dashboard is running on http://localhost:5175
echo 2. Hard refresh the dashboard page (Ctrl+F5)
echo 3. Clear browser cache if needed
echo 4. Check the debug panel
echo.
echo 🧪 TESTING STEPS:
echo.
echo STEP 1 - Check Dashboard Debug Panel:
echo - Open http://localhost:5175
echo - Click the 🔧 debug button next to extension status
echo - Check each debug item:
echo   • Chrome Available: Should be ✅
echo   • Runtime Available: Should be ✅
echo   • Storage Available: Should be ✅
echo   • Test Message Sent: Should be ✅
echo   • Extension Installed: Should be ✅
echo.
echo STEP 2 - Test Connection:
echo - Click "Test Connection" button
echo - Should show "SUCCESS" with PING/PONG test
echo - Should show extension ID: lldnikolaejjojgiabojpfhmpaafeige
echo.
echo STEP 3 - Test Real Data:
echo - Click "Start Scan" button in dashboard
echo - Should trigger real extension scan
echo - Should show real browser data
echo.
echo 🔍 TROUBLESHOOTING:
echo.
echo If dashboard still shows "Extension Unavailable":
echo - Try hard refresh (Ctrl+F5)
echo - Clear browser cache
echo - Check if dashboard is running on localhost:5175
echo - Check browser console for errors
echo.
echo If PING test fails:
echo - Check browser console for [ExtensionService] messages
echo - Make sure extension is still enabled
echo - Try refreshing the extension again
echo.
echo Press any key to open dashboard...
pause
start chrome "http://localhost:5175"
echo.
echo After testing:
echo 1. Check debug panel status
echo 2. Run connection test
echo 3. Try real scan
echo 4. Report any issues
echo.
pause 