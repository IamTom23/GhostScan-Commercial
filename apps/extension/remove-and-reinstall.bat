@echo off
echo ========================================
echo    GhostScan - Remove and Reinstall
echo ========================================
echo.
echo 🔍 ISSUE PERSISTS:
echo - Background script still not running
echo - "Receiving end does not exist" error continues
echo - Need complete removal and reinstallation
echo.
echo 📋 COMPLETE REINSTALLATION STEPS:
echo.
echo 1. REMOVE EXTENSION COMPLETELY:
echo    - Go to chrome://extensions/
echo    - Find "GhostScan Privacy Tool"
echo    - Click "Remove" button
echo    - Confirm removal
echo    - Extension should be completely gone
echo.
echo 2. CLEAR BROWSER CACHE (OPTIONAL):
echo    - Press Ctrl+Shift+Delete
echo    - Select "Cached images and files"
echo    - Click "Clear data"
echo    - This ensures no cached extension data
echo.
echo 3. REINSTALL EXTENSION:
echo    - In chrome://extensions/
echo    - Enable "Developer mode" (toggle in top right)
echo    - Click "Load unpacked"
echo    - Navigate to: GhostScan-Commercial\apps\extension\dist
echo    - Select the dist folder and click "Select Folder"
echo    - Extension should install and show "Extension loaded"
echo.
echo 4. VERIFY INSTALLATION:
echo    - Extension should appear in list
echo    - Should show "No errors"
echo    - Status should be "Enabled"
echo.
echo 5. TEST BACKGROUND SCRIPT:
echo    - Click "Details" on extension
echo    - Click "background page" link
echo    - Should open DevTools
echo    - Console should show: "🔍 GhostScan Background Service Worker loaded"
echo.
echo 6. TEST EXTENSION FUNCTIONALITY:
echo    - Click extension icon in toolbar
echo    - Click "Test Chrome API" - should show all ✅
echo    - Click "Test Scan" - should work
echo.
echo 7. TEST DASHBOARD CONNECTION:
echo    - Go to dashboard (http://localhost:5175)
echo    - Hard refresh (Ctrl+F5)
echo    - Click "Test Connection" - should show SUCCESS
echo.
echo 8. TEST SCAN FUNCTIONALITY:
echo    - Click "Run New Scan" - should work
echo    - Should show real data after scan
echo.
echo ⚠️ IF STILL NOT WORKING:
echo.
echo Check for these issues:
echo - Wrong dist folder selected (should be apps/extension/dist)
echo - Extension not enabled after installation
echo - JavaScript errors in background page console
echo - Chrome version compatibility issues
echo.
echo Press any key to open Chrome extensions...
pause
start chrome "chrome://extensions/"
echo.
echo After reinstallation:
echo 1. Report if extension installs successfully
echo 2. Report if background script loads (console message)
echo 3. Report if extension works independently
echo 4. Report if dashboard connection works
echo 5. Report if scan functionality works
echo.
pause 