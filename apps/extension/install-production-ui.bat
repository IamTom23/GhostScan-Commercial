@echo off
echo ========================================
echo Installing GhostScan with Production UI
echo ========================================
echo.

echo 📁 Copying updated files to dist folder...
copy popup.html dist\ >nul
copy popup.css dist\ >nul
copy manifest.json dist\ >nul
copy popup.js dist\ >nul
echo ✅ All files copied successfully
echo.

echo 🔄 Installing extension from dist folder...
echo.
echo 📋 Installation Steps:
echo    1. Open Chrome and go to chrome://extensions/
echo    2. Enable "Developer mode" (toggle in top right)
echo    3. Click "Load unpacked"
echo    4. Navigate to: %CD%\dist
echo    5. Select the dist folder and click "Select Folder"
echo.

echo 🎨 New Production UI Features:
echo    - Modern gradient header with professional branding
echo    - SVG icons for consistency and scalability
echo    - Improved typography with Inter font
echo    - Better color palette and visual hierarchy
echo    - Smooth animations and hover effects
echo    - Responsive design for different screen sizes
echo    - Accessibility improvements
echo.

echo ⚠️  If you have an old version installed:
echo    1. Remove the old GhostScan extension first
echo    2. Then install the new version from dist folder
echo.

echo ========================================
echo Extension ready for installation!
echo ========================================
pause 