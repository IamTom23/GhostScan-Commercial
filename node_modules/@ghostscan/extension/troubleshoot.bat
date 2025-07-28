@echo off
echo ========================================
echo    GhostScan Extension Troubleshooting
echo ========================================
echo.
echo If you're still seeing manifest.json content:
echo.
echo STEP 1: Remove the old extension completely
echo 1. Go to chrome://extensions/
echo 2. Find "GhostScan - Privacy Guardian" or "GhostScan Privacy Tool"
echo 3. Click "Remove" button
echo 4. Confirm removal
echo.
echo STEP 2: Clear Chrome cache
echo 1. Press Ctrl+Shift+Delete
echo 2. Select "Cached images and files"
echo 3. Click "Clear data"
echo.
echo STEP 3: Load the new extension
echo 1. Go to chrome://extensions/
echo 2. Enable "Developer mode" (top right)
echo 3. Click "Load unpacked"
echo 4. Navigate to: %CD%\dist
echo 5. Select the dist folder and click "Select Folder"
echo.
echo STEP 4: Test the extension
echo 1. Look for "GhostScan Privacy Tool" in extensions list
echo 2. Click the extension icon in toolbar
echo 3. Should see test popup with ghost emoji
echo.
echo If still not working, try:
echo - Restart Chrome completely
echo - Check Chrome console for errors (F12)
echo - Try incognito mode
echo.
echo Extension files present:
if exist "dist\manifest.json" echo ✅ manifest.json
if exist "dist\test-popup.html" echo ✅ test-popup.html
if exist "dist\background.js" echo ✅ background.js
if exist "dist\content.js" echo ✅ content.js
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/" 