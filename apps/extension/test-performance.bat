@echo off
echo Testing GhostScan Extension Performance Optimizations...
echo.

echo 1. Building optimized extension...
cd apps\extension
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo 2. Extension built successfully
echo.

echo 3. Performance optimizations applied:
echo    - Throttled DOM scanning (5-second cooldown)
echo    - Debounced mutation observer (1-second delay)
echo    - Limited history analysis (7 days, 500 items max)
echo    - Reduced cookie processing (500 max)
echo    - Single message listener (no duplicates)
echo    - Concurrent scan prevention
echo.

echo 4. To test the extension:
echo    - Load the extension in Chrome
echo    - Visit a complex website (like Facebook, LinkedIn, or a news site)
echo    - The browser should no longer freeze
echo    - Check console for performance logs
echo.

echo 5. Key improvements:
echo    - DOM queries limited to prevent freezing
echo    - Mutation observer debounced to reduce CPU usage
echo    - History analysis limited to prevent memory issues
echo    - Cookie processing capped to prevent timeouts
echo    - Message handling optimized to prevent conflicts
echo.

echo Performance test ready!
pause 