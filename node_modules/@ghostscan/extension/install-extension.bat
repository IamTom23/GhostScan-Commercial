@echo off
echo ========================================
echo    GhostScan Extension Installer
echo ========================================
echo.
echo This will open Chrome to install the extension.
echo.
echo Extension location:
echo %CD%\dist
echo.
echo Steps:
echo 1. Chrome will open to chrome://extensions/
echo 2. Enable "Developer mode" (top right)
echo 3. Click "Load unpacked"
echo 4. Select the dist folder above
echo 5. Click "Add extension"
echo.
pause
echo.
echo Opening Chrome...
start chrome "chrome://extensions/"
echo.
echo Chrome should now be open to the extensions page.
echo Follow the steps above to install GhostScan!
echo.
pause 