@echo off
echo ========================================
echo    GhostScan Extension - Ready to Install
echo ========================================
echo.
echo All files are ready! The extension is located at:
echo %CD%\dist
echo.
echo Installation Steps:
echo 1. Chrome will open to chrome://extensions/
echo 2. Enable "Developer mode" (top right toggle)
echo 3. Click "Load unpacked"
echo 4. Navigate to the dist folder above
echo 5. Select the dist folder and click "Select Folder"
echo.
echo Expected Result:
echo - Extension name: "GhostScan Privacy Tool"
echo - Click the extension icon to see debug popup
echo - Debug popup will show status and test buttons
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo Chrome should now be open. Follow the steps above!
echo.
pause 