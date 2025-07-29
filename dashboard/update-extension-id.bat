@echo off
setlocal enabledelayedexpansion

echo ========================================
echo GhostScan Extension ID Updater
echo ========================================

echo.
echo This script will update the extension ID in all necessary files.
echo.

set /p NEW_EXTENSION_ID="Enter the correct extension ID: "

if "%NEW_EXTENSION_ID%"=="" (
    echo No extension ID provided. Exiting.
    pause
    exit /b 1
)

echo.
echo Updating extension ID to: %NEW_EXTENSION_ID%
echo.

REM Update extensionService.ts
echo Updating extensionService.ts...
powershell -Command "(Get-Content 'src/services/extensionService.ts') -replace 'lldnikolaejjojgiabojpfhmpaafeige', '%NEW_EXTENSION_ID%' | Set-Content 'src/services/extensionService.ts'"

REM Update App.tsx
echo Updating App.tsx...
powershell -Command "(Get-Content 'src/App.tsx') -replace 'lldnikolaejjojgiabojpfhmpaafeige', '%NEW_EXTENSION_ID%' | Set-Content 'src/App.tsx'"

REM Update extension-test.html
echo Updating extension-test.html...
powershell -Command "(Get-Content 'public/extension-test.html') -replace 'lldnikolaejjojgiabojpfhmpaafeige', '%NEW_EXTENSION_ID%' | Set-Content 'public/extension-test.html'"

REM Update get-extension-id.html
echo Updating get-extension-id.html...
powershell -Command "(Get-Content 'public/get-extension-id.html') -replace 'lldnikolaejjojgiabojpfhmpaafeige', '%NEW_EXTENSION_ID%' | Set-Content 'public/get-extension-id.html'"

echo.
echo ✅ Extension ID updated in all files!
echo.
echo Next steps:
echo 1. Refresh the dashboard page
echo 2. Test the connection at: http://localhost:5178/extension-test.html
echo 3. Try the dashboard integration
echo.

pause 