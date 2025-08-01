@echo off
echo 🔄 Loading Updated GhostScan Extension...
echo.
echo 📋 This script will:
echo 1. Load the updated extension with new dashboard URL
echo 2. Test the extension-dashboard connection
echo.

echo 🚀 Loading extension...
echo.

REM Load the extension in Chrome
start chrome --load-extension="%~dp0dist" --disable-extensions-except="%~dp0dist"

echo.
echo ✅ Extension loaded! 
echo.
echo 📝 Next steps:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable the GhostScan extension if not already enabled
echo 3. Visit: https://dashboard-fyvwahblw-toms-projects-0165a016.vercel.app
echo 4. Test the extension-dashboard communication
echo.
echo 🔧 If you need to reload the extension:
echo - Go to chrome://extensions/
echo - Click the refresh icon on the GhostScan extension
echo.
pause 