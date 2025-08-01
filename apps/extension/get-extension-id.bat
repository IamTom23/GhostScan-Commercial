@echo off
echo ========================================
echo Getting Exact Extension ID
echo ========================================

echo.
echo 1. Manual Instructions:
echo    - Open Chrome browser manually
echo    - Go to: chrome://extensions/
echo    - OR type "chrome://extensions/" in the address bar
echo    - OR press Ctrl+Shift+E in Chrome
echo.

echo 2. Instructions:
echo    - Find "GhostScan Privacy Tool" in the list
echo    - Enable "Developer mode" (toggle in top right)
echo    - Look for the extension ID under the extension name
echo    - It should look like: lldnikolaejjojgiabojpfhmpaafeige
echo    - Copy this exact ID
echo.

echo 3. Current ID being used:
echo    lldnikolaejjojgiabojpfhmpaafeige
echo.

echo 4. If the ID is different:
echo    - Update the ID in extensionService.ts
echo    - Update the ID in App.tsx
echo    - Update the ID in test-extension-id.html
echo    - Reload the extension
echo.

pause 