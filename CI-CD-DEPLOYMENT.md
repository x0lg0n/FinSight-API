# 🚀 CI/CD Pipeline & Deployment Guide

This document outlines the complete CI/CD pipeline setup and deployment process for the FinSight API application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pipeline Stages](#pipeline-stages)
3. [GitHub Actions Setup](#github-actions-setup)
4. [Render Deployment](#render-deployment)
5. [Docker Configuration](#docker-configuration)
6. [Environment Variables](#environment-variables)
7. [Secrets Management](#secrets-management)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The CI/CD pipeline automatically:

- ✅ Runs linting and TypeScript checks on every push
- ✅ Executes unit tests with a PostgreSQL test database
- ✅ Builds and pushes Docker images to GitHub Container Registry
- ✅ Deploys to Render on successful main branch pushes
- ✅ Runs security scans (npm audit, Snyk)
- ✅ Uploads code coverage reports

**Supported Branches:**

- `main` - Production builds and deployment
- `develop` - Staging builds, no auto-deploy

---

## Pipeline Stages

### 1. Lint & Type Check

- **File:** `.github/workflows/ci-cd.yml`
- **Trigger:** All pushes and PRs
- **Steps:**
  - Checkout code
  - Setup Node.js 18
  - Install dependencies
  - Run TypeScript compiler: `pnpm run lint`
- **Status:** Blocks merge if failed ❌

### 2. Unit Tests

- **Trigger:** All pushes and PRs
- **Services:** PostgreSQL 16 test container
- **Steps:**
  - Spin up test database
  - Run migrations: `pnpm run db:push`
  - Execute tests: `pnpm run test --coverage`
  - Upload coverage to Codecov
- **Status:** Required for deployment ⚠️

### 3. Build Docker Image

- **Trigger:** Push to `main` or `develop`
- **Output:** Docker image in GitHub Container Registry (ghcr.io)
- **Multi-stage:** Build stage (TypeScript compilation) → Runtime stage (optimized)
- **Tags:**
  - `develop` branch → `ghcr.io/YOUR_USERNAME/Zorvyn:develop`
  - `main` branch → `ghcr.io/YOUR_USERNAME/Zorvyn:main` + semantic version tags
- **Caching:** Enabled for faster builds

### 4. Deploy to Render

- **Trigger:** Successful push to `main` branch
- **Method:** Render Deploy Hook API
- **Requires:** GitHub Actions secrets configured
- **Auto-rollback:** ✅ Built into Render

### 5. Security Scan

- **Tools:** npm audit, Snyk (optional)
- **Trigger:** All builds
- **Policy:** Warns on moderate vulnerabilities, continues on failure

---

## GitHub Actions Setup

### Prerequisites

1. **Repository on GitHub:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/Zorvyn.git
   git push -u origin main
   ```

2. **GitHub Actions Enabled:**
   - Navigate to repo → Settings → Actions → General
   - Ensure "Allow all actions and reusable workflows" is selected

### File Location

```env
.github/
└── workflows/
    └── ci-cd.yml  ← Main pipeline configuration
```

### Viewing Pipeline Status

1. Go to your GitHub repository
2. Click **Actions** tab
3. View workflow runs, logs, and artifacts
4. PRs show pipeline status with checkmarks/crosses

---

## Render Deployment

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Create new Web Service

### Step 2: Connect GitHub Repository

1. Click **New** → **Web Service**
2. Select your GitHub repository
3. Click **Connect**

### Step 3: Configure Service

**Build Configuration:**

- **Name:** finsight-api
- **Environment:** Docker
- **Dockerfile:** `Dockerfile`
- **Instance Type:** Starter (free tier) or higher

**Environment Variables:**

```env
DATABASE_URL=postgresql://[user]:[pass]@[host]:5432/[db]
JWT_SECRET=[32-character base64 string]
JWT_EXPIRY=7d
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

**Note:** Use `.env.render` for local testing:

```bash
cp .env.example .env.render
# Edit .env.render with your Render database credentials
```

### Step 4: Create PostgreSQL Database on Render

1. Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name:** finance-db
   - **Database:** finance_production
   - **User:** postgres
   - **Plan:** Free (suitable for development) or Starter+
3. Copy connection string to `DATABASE_URL` in Web Service

### Step 5: Link GitHub Actions to Render

GitHub Actions will automatically deploy when you push to `main` branch.

If manual deployment needed:

1. Render Dashboard → Your Web Service → **Manual Deploy**
2. Or use API:

```bash
curl https://api.render.com/deploy/srv-YOUR_SERVICE_ID?key=YOUR_API_KEY -X POST
```

---

## Docker Configuration

### Dockerfile Structure

```dockerfile
# Stage 1: Builder
- Install dependencies
- Compile TypeScript
- Generate Prisma client

# Stage 2: Runtime
- Fresh Alpine image
- Production dependencies only
- Non-root user (nodejs:1001)
- Health checks enabled
- Graceful signal handling with dumb-init
```

### Build Locally

```bash
# Build image
docker build -t finsight-api:latest .

# Run with docker-compose
docker-compose up -d

# Or standalone with environment
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  finsight-api:latest
```

### Docker Image Optimization

- **Multi-stage build:** Reduces image size 60%
- **Alpine base image:** 40MB vs 900MB+ with ubuntu
- **Layer caching:** Speeds up repeated builds
- **Security:** Non-root user, minimal attack surface

---

## Environment Variables

### Development (`.env`)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_dev
JWT_SECRET=dev-secret-key
JWT_EXPIRY=7d
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000
```

### Testing (`.env.test`)

```env
DATABASE_URL=postgresql://test:testpass@localhost:5432/finance_test
JWT_SECRET=test-secret
JWT_EXPIRY=1h
NODE_ENV=test
LOG_LEVEL=warn
PORT=3001
```

### Production (Render UI)

```env
DATABASE_URL=postgresql://[render-connection]
JWT_SECRET=[secure-random-string]
JWT_EXPIRY=7d
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

### Generating JWT_SECRET

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}) -as [byte[]])

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Secrets Management

### GitHub Actions Secrets

1. Go to Repository → Settings → **Secrets and variables** → **Actions**

2. **Required Secrets:**

| Secret Name | Value | Example |

|--|--|--|
| `RENDER_SERVICE_ID` | Your Render Web Service ID | `srv-abc123def456` |
| `RENDER_API_KEY` | Your Render API key | (generate in Render account settings) |
| `SNYK_TOKEN` | Snyk security scanning token | (optional, from snyk.io) |
| `SLACK_WEBHOOK_URL` | Slack channel webhook | (optional, for notifications) |

### Getting Render Service ID & API Key

**Service ID:**

1. Render Dashboard → Your Web Service
2. Copy from URL: `https://dashboard.render.com/web/srv-YOUR_SERVICE_ID`

**API Key:**

1. Account Settings → **API Keys**
2. Create new key
3. Copy to GitHub Actions secrets

### How Secrets are Used

```yaml
# In .github/workflows/ci-cd.yml
- name: Deploy to Render
  run: |
    curl https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }} -X POST
```

**Security Best Practices:**

- ✅ Secrets never printed in logs
- ✅ Each secret has minimum required permissions
- ✅ Rotate `RENDER_API_KEY` every 3-6 months
- ✅ Never commit `.env` files to git

---

## Troubleshooting

### Issue: Lint Failures

**Error:** `TypeScript error TS7030: Not all code paths return a value`

**Solution:**

```bash
pnpm run lint
# Fix errors locally before pushing
```

### Issue: Test Failures with Database

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**

```bash
# Ensure PostgreSQL is running
docker-compose up -d postgres

# Or check GitHub Actions logs for database setup
cat ~/.github/workflows/ci-cd.yml
```

### Issue: Docker Build Fails

**Error:** `Error: ENOENT: no such file or directory`

**Solution:**

```bash
# Rebuild with verbose output
docker build -t finsight-api:latest --progress=plain .

# Ensure all files are present
ls -la Dockerfile prisma.config.ts package.json
```

### Issue: Render Deployment Fails

**Error:** `Health check failed`

**Solution:**

1. Check application logs: Render Dashboard → Logs
2. Verify `DATABASE_URL` is correct
3. Ensure database is running on Render
4. Check `/health` endpoint responds with 200

### Issue: GitHub Actions Won't Trigger

**Error:** `workflow doesn't exist`

**Solution:**

```bash
# Ensure file is in correct location
ls -la .github/workflows/ci-cd.yml

# Check YAML syntax
yamllint .github/workflows/ci-cd.yml

# Push a new commit to trigger
git commit --allow-empty -m "Trigger workflow"
git push origin main
```

---

## Quick Reference Commands

```bash
# Local development
pnpm install
pnpm run dev

# Run tests locally
pnpm run test --coverage

# Build Docker image
docker build -t finsight-api:latest .

# Push to GitHub Container Registry
docker push ghcr.io/YOUR_USERNAME/Zorvyn:main

# Deploy manually to Render
curl https://api.render.com/deploy/srv-YOUR_SERVICE_ID?key=YOUR_API_KEY -X POST

# Check Render logs
# Via dashboard or Render CLI
render logs --service finsight-api --follow
```

---

## Monitoring & Maintenance

### GitHub Actions Insights

- **Actions tab** → See all workflow runs
- **Insights** → View success rate, average duration
- **Failed jobs** → Click to see detailed logs

### Render Monitoring

- **Metrics** → CPU, memory, request count
- **Logs** → Real-time application logs
- **Deploys** → Deployment history and rollback

### Health Checks

- **Application:** `GET /health` → `{ "status": "ok" }`
- **Database:** Automated check on startup
- **Server:** Port 3000 must be accessible

---

## Next Steps

1. ✅ Push repo to GitHub
2. ✅ Create Render account and database
3. ✅ Add GitHub Actions secrets
4. ✅ Create Render Web Service → Link GitHub
5. ✅ Make a test push to main branch
6. ✅ Monitor GitHub Actions and Render deployment
7. ✅ Verify application running at Render public URL

For issues or questions, check Render docs and GitHub Actions documentation.
