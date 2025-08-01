@echo off
echo ========================================
echo    GhostScan Extension - FINAL REFRESH
echo ========================================
echo.
echo ✅ MANIFEST FIXED:
echo - Added "history" permission
echo - Added "externally_connectable" for localhost
echo - Added localhost host permissions
echo - All files are present and correct
echo.
echo 🔄 REFRESH STEPS:
echo 1. Go to chrome://extensions/
echo 2. Find "GhostScan Privacy Tool"
echo 3. Click the refresh/reload button (circular arrow)
echo 4. Wait for extension to reload completely
echo 5. Check for any error messages (should be none)
echo.
echo 🧪 TESTING STEPS:
echo.
echo STEP 1 - Test Extension Popup:
echo - Click the extension icon in toolbar
echo - Should see debug popup
echo - Click "Test Chrome API" button
echo - All APIs should show ✅ (including history)
echo - Click "Test Scan" button
echo - Should complete without errors
echo.
echo STEP 2 - Test Dashboard Connection:
echo - Open dashboard at http://localhost:5175
echo - Click the 🔧 debug button
echo - All items should show ✅
echo - Click "Test Connection" button
echo - Should show "SUCCESS" with PING/PONG test
echo.
echo 🔍 EXPECTED RESULTS:
echo - Extension popup works perfectly
echo - Dashboard shows "🔗 Extension Connected"
echo - Real scanning data appears in dashboard
echo - No console errors
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After refreshing:
echo 1. Test extension popup first
echo 2. Then test dashboard connection
echo 3. Report any issues found
echo.
pause 