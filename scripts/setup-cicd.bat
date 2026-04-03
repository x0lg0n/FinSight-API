@echo off
REM ==================== FINANCE BACKEND CI/CD SETUP (Windows) ====================
REM This script helps configure GitHub Actions secrets for CI/CD deployment
REM Run this after creating your GitHub repository
REM Usage: setup-cicd.bat

setlocal enabledelayedexpansion

echo.
echo 🚀 Finance Backend CI/CD Setup (Windows)
echo ======================================
echo.

REM Check if GitHub CLI is installed
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitHub CLI not found. Install from: https://cli.github.com/
    pause
    exit /b 1
)

REM Check authentication
gh auth status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Not authenticated with GitHub. Run: gh auth login
    pause
    exit /b 1
)

echo ✅ GitHub CLI authenticated
echo.

REM Get repository info
for /f %%i in ('gh repo view --json nameWithOwner -q') do set REPO=%%i
echo 📦 Repository: %REPO%
echo.

REM Generate JWT Secret using Node.js
echo 🔐 Generating JWT_SECRET...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set JWT_SECRET=%%i
echo ✅ JWT_SECRET generated
echo.

REM Prompt for Render credentials
echo 🎯 Render Configuration
echo ======================
echo.
echo Get these values from your Render dashboard:
echo   - Service ID: https://dashboard.render.com/web/srv-YOUR_ID
echo   - API Key: https://dashboard.render.com/account/api-keys
echo.

set /p RENDER_SERVICE_ID="Enter your Render Service ID (e.g., srv-abc123): "
set /p RENDER_API_KEY="Enter your Render API Key: "
echo.

if "%RENDER_SERVICE_ID%"=="" (
    echo ❌ Render Service ID cannot be empty
    pause
    exit /b 1
)

if "%RENDER_API_KEY%"=="" (
    echo ❌ Render API Key cannot be empty
    pause
    exit /b 1
)

REM Optional: Snyk
set /p SNYK_PROMPT="Do you want to enable Snyk security scanning? (y/n): "
if /i "%SNYK_PROMPT%"=="y" (
    set /p SNYK_TOKEN="Enter your Snyk API Token (or leave empty to skip): "
)
echo.

REM Optional: Slack
set /p SLACK_PROMPT="Do you want to enable Slack notifications? (y/n): "
if /i "%SLACK_PROMPT%"=="y" (
    set /p SLACK_WEBHOOK_URL="Enter your Slack Webhook URL: "
)
echo.

REM Set GitHub Actions Secrets
echo.
echo 🔑 Setting GitHub Actions Secrets...
echo ===================================
echo.

echo | set /p=!JWT_SECRET! | gh secret set JWT_SECRET --repo %REPO%
echo ✅ JWT_SECRET set
timeout /t 1 /nobreak >nul

echo | set /p=!RENDER_SERVICE_ID! | gh secret set RENDER_SERVICE_ID --repo %REPO%
echo ✅ RENDER_SERVICE_ID set
timeout /t 1 /nobreak >nul

echo | set /p=!RENDER_API_KEY! | gh secret set RENDER_API_KEY --repo %REPO%
echo ✅ RENDER_API_KEY set
timeout /t 1 /nobreak >nul

if not "!SNYK_TOKEN!"=="" (
    echo | set /p=!SNYK_TOKEN! | gh secret set SNYK_TOKEN --repo %REPO%
    echo ✅ SNYK_TOKEN set
    timeout /t 1 /nobreak >nul
)

if not "!SLACK_WEBHOOK_URL!"=="" (
    echo | set /p=!SLACK_WEBHOOK_URL! | gh secret set SLACK_WEBHOOK_URL --repo %REPO%
    echo ✅ SLACK_WEBHOOK_URL set
    timeout /t 1 /nobreak >nul
)

echo.
echo ✅ All secrets configured!
echo.
echo 📋 Configuration Summary:
echo    Repository: %REPO%
echo    Render Service ID: %RENDER_SERVICE_ID:~0,10%...
echo.
echo 📚 Next Steps:
echo    1. Visit: https://github.com/%REPO%/settings/secrets/actions
echo    2. Verify all secrets are present
echo    3. Make a test push to 'main' branch to trigger pipeline
echo    4. Monitor GitHub Actions tab
echo.
echo 📖 Documentation: See CI-CD-DEPLOYMENT.md for detailed guide
echo.
pause
