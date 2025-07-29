@echo off
echo 🚀 Deploying GhostScan to Vercel (Fixed Version)

echo.
echo 📋 Pre-deployment checks:
echo - Removing Husky prepare script from package.json
echo - Creating .vercelignore file
echo - Setting up proper Vercel configuration

echo.
echo 🔧 Installing dependencies without scripts...
npm ci --ignore-scripts

echo.
echo 🏗️ Building all workspaces...
npm run build

echo.
echo 🚀 Deploying to Vercel...
vercel --prod

echo.
echo ✅ Deployment complete!
echo.
echo 📝 Next steps:
echo 1. Check your Vercel dashboard for the deployment URL
echo 2. Update your extension with the new dashboard URL
echo 3. Test the extension-dashboard communication
echo.
pause 