@echo off
echo ========================================
echo    GhostScan Extension - Refresh Required
echo ========================================
echo.
echo 🔧 MANIFEST UPDATED:
echo ✅ Added localhost communication permissions
echo ✅ Added externally_connectable settings
echo ✅ Rebuilt extension with new settings
echo.
echo 📋 NEXT STEPS:
echo 1. Go to chrome://extensions/
echo 2. Find "GhostScan Privacy Tool"
echo 3. Click the refresh/reload button (circular arrow)
echo 4. Wait for extension to reload
echo 5. Go back to dashboard and test again
echo.
echo 🔍 WHAT WAS FIXED:
echo - Extension can now communicate with localhost
echo - Dashboard can access Chrome APIs
echo - Runtime and Storage should now be available
echo.
echo ⚠️ IMPORTANT: You MUST refresh the extension
echo    for the new permissions to take effect!
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After refreshing the extension:
echo 1. Go back to dashboard
echo 2. Click the 🔧 debug button
echo 3. Check if Runtime Available is now ✅
echo 4. Test the connection again
echo.
pause 