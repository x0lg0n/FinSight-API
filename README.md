
<h1 align="center">FinSight API</h1>

<p align="center"><strong>Clarity for every transaction.</strong></p
>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-5.2-111827?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-7.6-0F172A?style=for-the-badge&logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img alt="CI/CD" src="https://img.shields.io/github/actions/workflow/status/x0lg0n/FinSight-API/ci-cd.yml?branch=master&label=CI%2FCD&logo=githubactions&logoColor=white&style=for-the-badge" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<p align="center">
  A production-grade REST API for financial records, role-based access control, and real-time analytics.
</p>

---

## 🎯 Overview

This backend demonstrates expert-level software engineering across:

1. **Backend Architecture** — Modular TypeScript + Express with clean separation of concerns
2. **Data Modeling** — PostgreSQL schema with Prisma ORM for type safety
3. **Access Control** — JWT-based authentication with role-based authorization
4. **Business Logic** — Aggregation queries for real-time dashboard analytics
5. **API Design** — RESTful endpoints with comprehensive Swagger documentation
6. **Validation & Error Handling** — Input validation with express-validator and global error handler
7. **Testing** — Unit and integration tests with Jest + Supertest
8. **Security** — Helmet, CORS, rate limiting, password hashing

---

## ✨ Key Features

### ✅ All Core Requirements Implemented

- [x] User and Role Management (VIEWER, ANALYST, ADMIN)
- [x] Financial Records Management (CRUD with soft delete)
- [x] Dashboard Summary APIs (income, expenses, trends, analytics)
- [x] Access Control Logic (role-based guards on all endpoints)
- [x] Validation and Error Handling (comprehensive input validation)

### ✅ All Optional Enhancements Included

- [x] JWT Authentication with bcryptjs password hashing
- [x] Pagination with limit/offset on all list endpoints
- [x] Full-text Search on category and notes
- [x] Soft Delete functionality (preserves audit history)
- [x] Rate Limiting on authentication endpoints
- [x] Comprehensive Test Suite (auth, records, dashboard)
- [x] Swagger/OpenAPI Documentation at `/api/docs`

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Database Option A:** Docker Desktop (to run PostgreSQL via Docker Compose)
- **Database Option B:** Local PostgreSQL 15+ ([Download](https://www.postgresql.org/download/))
- **Git** (optional)

### 1. Clone & Install

```bash
# Navigate to project directory
cd FinSight-API

# Install dependencies
npm install
# or with pnpm (recommended)
pnpm install
```

### 2. Setup Database

```bash
# Option A: Start PostgreSQL via Docker
docker-compose up -d

# Option B: Use your local PostgreSQL instance instead
# Make sure DATABASE_URL in .env points to that instance
createdb finance_db; -- Create database if using local PostgreSQL

# Push Prisma schema to database
npm run db:push

# Seed database with demo users and data
npm run db:seed
```

You can use either Docker or local PostgreSQL. The API only requires a valid `DATABASE_URL`.

### 3. Start the Server

```bash
npm run dev
```

You should see:

```env
✅ Database connection successful
✅ Server is running on http://localhost:3000
📚 API Documentation: http://localhost:3000/api/docs
🏥 Health check: http://localhost:3000/health
```

---

## 🔐 Demo Credentials

Use these accounts to test the API:

| Email                | Password       | Role    | Access                                  |
|----------------------|----------------|---------|-----------------------------------------|
| `admin@finance.dev`  | `Admin@1234`   | ADMIN   | Full access to all features             |
| `analyst@finance.dev`| `Analyst@1234` | ANALYST | View records, analytics, no create/edit |
| `viewer@finance.dev` | `Viewer@1234`  | VIEWER  | View own data only                      |

---

## 📖 API Documentation

### Live Interactive Docs

**Swagger UI:** `http://localhost:3000/api/docs`

All endpoints are documented with:

- Request/response schemas
- Authorization requirements
- Example values
- Error responses

### Core Endpoints Summary

#### Authentication

```env
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login, get JWT token
GET    /api/auth/me                # Get current user profile
```

#### Financial Records

```env
POST   /api/records                # Create record (Admin)
GET    /api/records                # List all records (Analyst, Admin)
GET    /api/records/:id            # Get record by ID
GET    /api/records/my/list        # List own records (All roles)
PUT    /api/records/:id            # Update record (Admin)
DELETE /api/records/:id            # Delete record (Admin, soft delete)
```

**Query Parameters on GET /api/records:**

- `?type=INCOME|EXPENSE` — Filter by record type
- `?category=Salary` — Filter by category (partial match)
- `?from=2024-01-01` — Start date filter
- `?to=2024-12-31` — End date filter
- `?search=groceries` — Search in category and notes
- `?page=1&limit=20` — Pagination (default 20, max 100)

#### Dashboard Analytics

```env
GET    /api/dashboard/summary      # Total income, expenses, balance
GET    /api/dashboard/categories   # Category breakdown (Analyst+)
GET    /api/dashboard/trends       # Monthly trends 12 months (Analyst+)
GET    /api/dashboard/recent       # Last 10 transactions
GET    /api/dashboard/top-categories # Top 5 spending categories (Analyst+)
```

#### User Management

```env
GET    /api/users                  # List all users (Admin)
GET    /api/users/:id              # Get user (Admin)
PATCH  /api/users/:id/role         # Update role (Admin)
PATCH  /api/users/:id/status       # Toggle active/inactive (Admin)
DELETE /api/users/:id              # Deactivate user (Admin)
```

---

## 🔑 Authentication

The API uses **JWT (JSON Web Tokens)** for stateless authentication.

### Login Flow

```bash
# 1. Get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.dev","password":"Admin@1234"}'

# Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {...}
  }
}

# 2. Use token in Authorization header
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Token Details

- **Expiry:** 7 days (configurable via `JWT_EXPIRY` env var)
- **Payload:** `{ userId, role, email, iat, exp }`
- **Secret:** Stored in `.env` file (`JWT_SECRET`)

---

## 👥 Role-Based Access Control

| Permission                          | Viewer | Analyst | Admin |
|-------------------------------------|:-------:|:---:|:---:|
| View own records                    | ✓   | ✓ | ✓ |
| View all records                    | ✗   | ✓ | ✓ |
| View dashboard summary              | ✓   | ✓ | ✓ |
| View analytics (categories, trends) | ✗   | ✓ | ✓ |
| Create records                      | ✗   | ✗ | ✓ |
| Update records                      | ✗   | ✗ | ✓ |
| Delete records                      | ✗   | ✗ | ✓ |
| Manage users (CRUD)                 | ✗   | ✗ | ✓ |
| Assign roles                        | ✗   | ✗ | ✓ |

---

## 🗄️ Data Models

### User

```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (bcrypt hashed)
  name: string
  role: 'VIEWER' | 'ANALYST' | 'ADMIN'
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### FinancialRecord

```typescript
{
  id: string (UUID)
  amount: Decimal (12,2) // Precise financial arithmetic
  type: 'INCOME' | 'EXPENSE'
  category: string       // Free-form, e.g., "Salary", "Rent"
  date: DateTime
  notes: string?         // Optional, max 500 chars
  userId: string (FK)
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime?   // Soft delete: null = active, set = deleted
}
```

---

## 📊 Dashboard Query Strategy

All dashboard aggregations use **PostgreSQL GROUP BY and SUM** for performance:

```sql
-- Example: Monthly trends
SELECT DATE_TRUNC('month', date) as month,
       SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
       SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
FROM financial_records
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('month', date)
ORDER BY month ASC;
```

**No application-layer loops.** Queries execute directly on the database for optimal performance.

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode (rerun on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Coverage

- **Auth Tests** — Registration, login, token validation, inactive users
- **Records Tests** — CRUD operations, filtering, pagination, soft delete, role checks
- **Dashboard Tests** — Summary, trends, category breakdown, access control

Example test run:

```test
PASS  tests/auth.test.ts
PASS  tests/records.test.ts
PASS  tests/dashboard.test.ts

Tests: 25 passed
Coverage: 85%
```

---

## 🛠️ Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/finance_db"

# Server
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# API
API_BASE_URL=http://localhost:3000
API_DOCS_ENABLED=true
```

---

## 📁 Project Structure

```folder
FinSight-API/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed script
├── src/
│   ├── config/                 # Configuration
│   │   ├── database.ts         # Prisma client
│   │   ├── env.ts              # Env validation
│   │   └── swagger.ts          # API docs config
│   ├── middleware/             # Express middleware
│   │   ├── authenticate.ts     # JWT verification
│   │   ├── authorize.ts        # Role-based guards
│   │   ├── validate.ts         # Input validation
│   │   ├── errorHandler.ts     # Global error handling
│   │   └── rateLimiter.ts      # Rate limiting
│   ├── modules/                # Feature modules
│   │   ├── auth/               # Authentication
│   │   ├── users/              # User management
│   │   ├── records/            # Financial records
│   │   └── dashboard/          # Analytics
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── utils/
│   │   ├── ApiError.ts         # Custom error class
│   │   └── ApiResponse.ts      # Response wrapper
│   ├── app.ts                  # Express setup
│   └── server.ts               # Server entry point
├── tests/                      # Test suites
│   ├── auth.test.ts
│   ├── records.test.ts
│   └── dashboard.test.ts
├── .env                        # Environment variables
├── .env.example                # Template
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## 🔍 Example API Usage

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance.dev",
    "password": "Admin@1234"
  }'
```

### Create a Financial Record (Admin)

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000.00,
    "type": "INCOME",
    "category": "Salary",
    "date": "2024-04-02T10:00:00Z",
    "notes": "April salary"
  }'
```

### Get Dashboard Summary

```bash
curl -X GET http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### List Records with Filters

```bash
curl -X GET 'http://localhost:3000/api/records?type=EXPENSE&category=Rent&page=1&limit=10' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🚨 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

### HTTP Status Codes

- `200` — OK (successful GET, PUT, PATCH)
- `201` — Created (successful POST)
- `400` — Bad Request (validation error)
- `401` — Unauthorized (missing/invalid JWT)
- `403` — Forbidden (sufficient permissions required)
- `404` — Not Found (resource doesn't exist)
- `409` — Conflict (e.g., duplicate email)
- `429` — Too Many Requests (rate limit exceeded)
- `500` — Internal Server Error

---

## 🔒 Security Features

1. **Password Hashing** — bcryptjs with salt rounds = 10
2. **JWT Signing** — HS256 algorithm with strong secret
3. **Helmet** — Security headers (CSP, X-Frame-Options, etc.)
4. **CORS** — Configurable cross-origin requests
5. **Rate Limiting** — 20 auth attempts per 15 minutes
6. **Input Validation** — express-validator on all endpoints
7. **SQL Injection Prevention** — Prisma parameterized queries
8. **Soft Deletes** — Preserves audit history
9. **Inactive User Handling** — Deactivated users cannot login
10. **No Password in Responses** — Passwords never returned via API

---

## 📈 Performance Optimizations

1. **Database Queries** — All aggregations use PostgreSQL GROUP BY
2. **Parallel Queries** — Promise.all() for independent DB calls
3. **Indexes** — Added on userId, date, type, deletedAt
4. **Pagination** — Limit/offset prevents large result sets
5. **Decimal Precision** — Financial amounts stored as Decimal(12,2)
6. **Soft Deletes** — Query optimization by filtering deletedAt

---

## 🧹 Available Commands

```bash
# Development
npm run dev                    # Start dev server with hot reload

# Database
npm run db:push               # Sync Prisma schema to database
npm run db:reset              # Reset database (destructive!)
npm run db:seed               # Seed demo data
npm run prisma:generate       # Generate Prisma client

# Testing
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report

# Build & Production
npm run build                 # Compile TypeScript
npm run start                 # Run compiled server
npm run lint                  # Type check
```

---

## 📝 Assumptions & Design Decisions

1. **Single Access Token** — No refresh token
2. **Soft Deletes Only** — Hard deletes intentionally excluded for audit trail
3. **Free-form Categories** — No enum to allow flexible record creation
4. **UTC Timestamps** — All dates stored and returned as ISO 8601
5. **Decimal Precision** — Financial amounts use Decimal(12,2) to prevent float errors
6. **Role Defaults** — New users default to VIEWER role for security
7. **Analyst = Analyst+ Admin Permissions** — But analysts cannot mutate data
8. **Viewers See Own Data Only** — Not limited by default filter

---

## 🚀 Deployment

### Railway (Recommended)

1. Connect GitHub repository
2. Add PostgreSQL database add-on
3. Set environment variables in Railway dashboard
4. Deploy (auto on push to main)

```bash
# Database URL will be auto-provided
# Just set JWT_SECRET and other custom vars
```

### Manual Deployment (VPS/Cloud)

```bash
# Build
npm run build

# Start (production)
NODE_ENV=production npm start

# Use process manager (PM2)
pm2 start dist/server.js --name finance-api
```

---

## 🤝 Contributing & Code Quality

- **TypeScript Strict Mode** — All `strict` compiler options enabled
- **ESLint Ready** — Can integrate with recommended configs
- **No Console Logs** — Debug logging could be added in middleware
- **Consistent Formatting** — Follows Prettier conventions

---

## 📄 License

MIT — Open for educational evaluation

---

**Ready to evaluate?** Start with:

1. `npm install && npm run db:push && npm run db:seed`
2. `npm run dev`
3. Visit `http://localhost:3000/api/docs`
4. Use demo credentials to explore the API

**Questions?** Review the inline code comments or check the Swagger docs for detailed endpoint specifications.
