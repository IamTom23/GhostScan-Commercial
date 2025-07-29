@echo off
echo 🔄 Reloading GhostScan Extension (Fixed Manifest)...
echo.

echo 🔧 Copying fixed manifest...
copy manifest.json dist\manifest.json
echo ✅ Manifest copied

echo.
echo 🚀 Loading extension in Chrome...
start chrome --load-extension="%~dp0dist"

echo.
echo ✅ Extension loaded! 
echo.
echo 📝 Next steps:
echo 1. Go to chrome://extensions/
echo 2. Enable the GhostScan extension
echo 3. Visit: https://dashboard-fyvwahblw-toms-projects-0165a016.vercel.app
echo 4. Test the connection
echo.
pause 