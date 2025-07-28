@echo off
echo ========================================
echo Testing Dashboard-to-Extension Communication
echo ========================================

echo.
echo 1. Opening test page in browser...
echo    This will test direct communication with the extension
echo.

start http://localhost:5173/test-extension-id.html

echo.
echo 2. Instructions:
echo    - Click "Test PING" button to test basic communication
echo    - Click "Test START_SCAN" button to test scan functionality
echo    - Check browser console for detailed logs
echo    - Check extension background console for incoming messages
echo.

echo 3. Expected Results:
echo    - PING should return: {"message": "PONG", "timestamp": "..."}
echo    - START_SCAN should return scan results
echo    - If you see "Receiving end does not exist", the extension ID is wrong
echo    - If you see "Could not establish connection", there's a manifest issue
echo.

echo 4. If tests fail:
echo    - Check that extension is installed and enabled
echo    - Check that dashboard is running on http://localhost:5173
echo    - Check extension background console for errors
echo    - Try reloading the extension
echo.

pause 