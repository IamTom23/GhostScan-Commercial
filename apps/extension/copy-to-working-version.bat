@echo off
echo ========================================
echo Copying Production UI to Working Extension
echo ========================================
echo.

echo 📁 Copying updated files to working extension directory...
copy popup.html "..\..\GhostScan-Commercial\apps\extension\dist\" >nul
copy popup.css "..\..\GhostScan-Commercial\apps\extension\dist\" >nul
copy manifest.json "..\..\GhostScan-Commercial\apps\extension\dist\" >nul
copy popup.js "..\..\GhostScan-Commercial\apps\extension\dist\" >nul
echo ✅ All files copied successfully
echo.

echo 🔄 Next Steps:
echo    1. Go to chrome://extensions/
echo    2. Find the GhostScan extension (the one that connects to dashboard)
echo    3. Click the refresh/reload button
echo    4. Or remove and reinstall from: ..\..\GhostScan-Commercial\apps\extension\dist\
echo.

echo 🎨 You should now see:
echo    - Modern gradient header
echo    - Professional styling
echo    - SVG icons instead of emojis
echo    - Better typography and spacing
echo    - All dashboard functionality preserved
echo.

echo ========================================
echo Production UI copied to working version!
echo ========================================
pause 