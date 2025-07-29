@echo off
echo ========================================
echo    GhostScan Dashboard - Real Data Test
echo ========================================
echo.
echo 🚀 NEW FEATURES IMPLEMENTED:
echo ✅ Dashboard now connects to extension
echo ✅ Real privacy scanning data displayed
echo ✅ Extension status indicator
echo ✅ Automatic data loading on startup
echo ✅ Real-time scan triggering
echo.
echo 📊 What the dashboard now shows:
echo - Real cookie analysis from your browser
echo - Actual OAuth connections detected
echo - Real browsing history patterns
echo - Live tracking script detection
echo - Personalized risk scores
echo - Extension connection status
echo.
echo 🔍 To test the real data integration:
echo 1. Make sure the extension is installed and working
echo 2. Start the dashboard: npm run dev
echo 3. Open http://localhost:5175
echo 4. Check the extension status indicator
echo 5. Click "Start Scan" to trigger real scanning
echo 6. View real data in all dashboard sections
echo.
echo 📈 Expected results:
echo - Extension status shows "🔗 Extension Connected"
echo - Privacy score reflects real browser data
echo - Apps list shows actual detected services
echo - Breach alerts based on real scan results
echo - Recommendations from actual analysis
echo.
echo ⚠️ Note: Dashboard will fall back to mock data
echo    if extension is not available
echo.
echo Press any key to start the dashboard...
pause
cd ..
npm run dev
echo.
echo Dashboard should now be running at http://localhost:5175
echo.
pause 