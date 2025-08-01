@echo off
echo ========================================
echo GhostScan Production Deployment
echo ========================================

echo.
echo This script will help you deploy GhostScan to production.
echo.

echo 1. Choose your hosting provider:
echo    [1] Vercel (Recommended - Easy setup)
echo    [2] Netlify (Good alternative)
echo    [3] AWS (Advanced - More control)
echo    [4] Manual deployment
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Deploying to Vercel...
    echo.
    echo Step 1: Install Vercel CLI
    echo npm install -g vercel
    echo.
    echo Step 2: Deploy Dashboard
    echo cd apps/dashboard
    echo vercel --prod
    echo.
    echo Step 3: Deploy Backend
    echo cd ../backend
    echo vercel --prod
    echo.
    echo Step 4: Configure Environment Variables
    echo - Go to Vercel Dashboard
    echo - Set EXTENSION_ID, API_URL, DATABASE_URL
    echo.
    pause
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo 🚀 Deploying to Netlify...
    echo.
    echo Step 1: Install Netlify CLI
    echo npm install -g netlify-cli
    echo.
    echo Step 2: Build Dashboard
    echo cd apps/dashboard
    echo npm run build
    echo.
    echo Step 3: Deploy to Netlify
    echo netlify deploy --prod --dir=dist
    echo.
    pause
    goto :end
)

if "%choice%"=="3" (
    echo.
    echo 🚀 Deploying to AWS...
    echo.
    echo This requires AWS CLI and more setup.
    echo See PRODUCTION_DEPLOYMENT_GUIDE.md for details.
    echo.
    pause
    goto :end
)

if "%choice%"=="4" (
    echo.
    echo 📋 Manual Deployment Steps:
    echo.
    echo 1. Build the dashboard:
    echo    cd apps/dashboard
    echo    npm run build
    echo.
    echo 2. Upload dist/ folder to your web server
    echo.
    echo 3. Configure your domain and SSL
    echo.
    echo 4. Update extension manifest with your domain
    echo.
    echo 5. Package and distribute extension
    echo.
    pause
    goto :end
)

echo Invalid choice. Please run the script again.
pause
exit /b 1

:end
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Register domain (e.g., ghostscan.com)
echo 2. Set up SSL certificate
echo 3. Update extension manifest with production URLs
echo 4. Package extension for Chrome Web Store
echo 5. Test end-to-end functionality
echo 6. Launch to consumers!
echo.
echo See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions.
echo.
pause 