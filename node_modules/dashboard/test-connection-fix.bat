@echo off
echo ========================================
echo    GhostScan - Connection Fix Test
echo ========================================
echo.
echo 🔧 FIX APPLIED:
echo - Changed extension detection logic
echo - Now uses testMessageSent instead of installed
echo - Extension status should show: 🔗 Extension Connected
echo.
echo 📋 TESTING STEPS:
echo.
echo 1. REFRESH DASHBOARD:
echo    - Hard refresh the dashboard (Ctrl+F5)
echo    - Check console for [ExtensionService] messages
echo    - Should see "Extension detected and responding"
echo.
echo 2. CHECK EXTENSION STATUS:
echo    - Extension status should show: 🔗 Extension Connected
echo    - Debug panel should show:
echo      Chrome Available: ✅
echo      Runtime Available: ✅
echo      Storage Available: ❌ (expected)
echo      Test Message Sent: ✅
echo      Extension Installed: ✅ (now fixed)
echo.
echo 3. TEST REAL DATA:
echo    - Click "Start Scan" in dashboard
echo    - Should trigger extension scan
echo    - Dashboard should show real data after scan
echo.
echo ✅ EXPECTED RESULTS:
echo - Extension status: 🔗 Extension Connected
echo - Extension Installed: ✅
echo - Real data loading from extension
echo - No more "Extension not available" messages
echo.
echo Press any key to continue...
pause 