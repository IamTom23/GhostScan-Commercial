@echo off
echo 🔄 Reloading GhostScan Extension with Production Updates...
echo.

echo 📋 This script will:
echo 1. Ensure all files are up to date
echo 2. Load the extension with production dashboard URL
echo 3. Open test pages to verify connection
echo.

echo 🔧 Step 1: Copying updated manifest...
copy manifest.json dist\manifest.json
if %errorlevel% neq 0 (
    echo ❌ Failed to copy manifest.json
    pause
    exit /b 1
)
echo ✅ Manifest copied successfully

echo.
echo 🔧 Step 2: Copying test files...
copy test-extension-connection.html dist\test-extension-connection.html
echo ✅ Test files copied

echo.
echo 🚀 Step 3: Loading extension in Chrome...
start chrome --load-extension="%~dp0dist" --disable-extensions-except="%~dp0dist"

echo.
echo ⏳ Waiting 3 seconds for Chrome to load...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Step 4: Opening test pages...
start chrome "https://dashboard-fyvwahblw-toms-projects-0165a016.vercel.app"
timeout /t 2 /nobreak >nul
start chrome "file:///%~dp0dist/test-extension-connection.html"

echo.
echo ✅ Extension reloaded successfully!
echo.
echo 📝 Next steps:
echo 1. Check chrome://extensions/ to ensure extension is loaded
echo 2. Verify the extension is enabled (toggle should be blue)
echo 3. Test the connection on the dashboard
echo 4. Use the test page to verify communication
echo.
echo 🔧 Troubleshooting:
echo - If extension doesn't work, try refreshing it in chrome://extensions/
echo - Check browser console for any error messages
echo - Ensure you're on the correct dashboard URL
echo.
pause 