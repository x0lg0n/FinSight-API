# Finance Data Processing & Access Control Backend

## Product Requirements Document

> **Version:** 1.0 | **Author:** x0lg0n | **Date:** April 2026 | **Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Data Models](#5-data-models)
6. [Role & Permission Matrix](#6-role--permission-matrix)
7. [API Endpoints](#7-api-endpoints)
8. [API Response Format](#8-api-response-format)
9. [Authentication Flow](#9-authentication-flow)
10. [Input Validation Rules](#10-input-validation-rules)
11. [Optional Enhancements](#11-optional-enhancements)
12. [Build Timeline](#12-build-timeline)
13. [Assumptions & Decisions](#13-assumptions--decisions)
14. [README Structure](#14-readme-structure)
15. [Evaluation Criteria Mapping](#15-evaluation-criteria-mapping)

---

## 1. Overview

This document defines the product requirements for **FinSight API** — the authoritative submission for the Backend Engineering Assessment.

The system manages financial records, enforces role-based access control, and serves aggregated dashboard analytics to a frontend client. It is built as a single-service REST API using **TypeScript + Express**, backed by **PostgreSQL via Prisma ORM**, with all five core requirements and all seven optional enhancements in scope.

> **Design Philosophy:** A smaller, well-designed solution beats a large but inconsistent one. Every architectural decision in this PRD prioritizes clarity, correctness, and maintainability over unnecessary complexity.

---

## 2. Goals & Non-Goals

### 2.1 Goals

- Build a structured, maintainable REST API that demonstrates backend engineering depth
- Implement all five core requirements: Users & Roles, Financial Records, Dashboard APIs, Access Control, and Validation
- Implement all seven optional enhancements to maximize evaluation score
- Use PostgreSQL aggregation queries for dashboard logic — not application-layer loops
- Produce clean, readable TypeScript code with strict typing throughout
- Deliver a comprehensive README and live Swagger documentation at `/api/docs`

### 2.2 Non-Goals

- Production-grade infrastructure (load balancing, CDN, secrets management)
- Real payment processing or financial compliance (PCI-DSS)
- Frontend / UI — this is a backend-only submission
- Multi-tenancy or organization-level data isolation

---

## 3. Technology Stack

> TypeScript is chosen over JavaScript because this assignment explicitly evaluates **code quality and maintainability**. Prisma's auto-generated types, combined with strict TypeScript config, ensure the data model is self-documenting and errors are caught at compile time — not runtime.

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable LTS with full TypeScript support |
| Language | TypeScript 5.x | Type safety, maintainability, Prisma synergy |
| Framework | Express.js | Minimal & flexible — lets architecture shine |
| Package Manager | pnpm | Fast, disk-efficient, reliable Prisma + Jest support |
| ORM | Prisma | Auto-generated types, clean migrations, great DX |
| Database | PostgreSQL 16 | Strong SQL modeling, aggregation queries, reliability |
| Auth | JWT + bcryptjs | Stateless auth, role embedded in token payload |
| Validation | express-validator | Declarative input validation per route |
| Docs | Swagger / OpenAPI | Interactive docs at `/api/docs` |
| Testing | Jest + Supertest | Unit & integration tests for routes and services |
| Rate Limiting | express-rate-limit | Brute-force protection on auth endpoints |
| Security | Helmet + CORS | Security headers, cross-origin config |
| Deploy | Railway / Render | Free tier with Postgres add-on, pnpm auto-detected |

### Package Installation

```bash
# Core
pnpm add express prisma @prisma/client
pnpm add jsonwebtoken bcryptjs
pnpm add express-validator
pnpm add helmet cors express-rate-limit
pnpm add swagger-jsdoc swagger-ui-express

# TypeScript
pnpm add -D typescript ts-node nodemon
pnpm add -D @types/express @types/node
pnpm add -D @types/jsonwebtoken @types/bcryptjs
pnpm add -D @types/swagger-jsdoc @types/swagger-ui-express

# Testing
pnpm add -D jest supertest ts-jest
pnpm add -D @types/jest @types/supertest
```

---

## 4. Project Structure

The project uses a **module-based structure**, grouping related routes, controllers, and services by feature domain.

> **Separation rule:** Controllers handle HTTP only (parse request → call service → return response). Services hold all business logic and DB access. This ensures services are unit-testable without HTTP overhead.

```
FinSight-API/
├── prisma/
│   ├── schema.prisma          ← DB schema (single source of truth)
│   └── seed.ts                ← Seed admin + demo users
├── src/
│   ├── config/
│   │   ├── database.ts        ← Prisma client singleton
│   │   ├── swagger.ts         ← Swagger / OpenAPI config
│   │   └── env.ts             ← Env variable validation (fail fast on startup)
│   ├── middleware/
│   │   ├── authenticate.ts    ← JWT verification middleware
│   │   ├── authorize.ts       ← Role-based guard (requireRole helper)
│   │   ├── validate.ts        ← express-validator error collector
│   │   ├── errorHandler.ts    ← Global error handler (catches ApiError)
│   │   └── rateLimiter.ts     ← express-rate-limit config
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   ├── records/
│   │   │   ├── records.routes.ts
│   │   │   ├── records.controller.ts
│   │   │   └── records.service.ts
│   │   └── dashboard/
│   │       ├── dashboard.routes.ts
│   │       ├── dashboard.controller.ts
│   │       └── dashboard.service.ts
│   ├── types/
│   │   └── index.ts           ← Shared TS interfaces & enums
│   ├── utils/
│   │   ├── ApiError.ts        ← Custom error class with status code
│   │   └── ApiResponse.ts     ← Consistent JSON response wrapper
│   ├── app.ts                 ← Express app setup + middleware chain
│   └── server.ts              ← HTTP server entrypoint
├── tests/
│   ├── auth.test.ts
│   ├── records.test.ts
│   └── dashboard.test.ts
├── .env
├── .env.example
├── tsconfig.json
├── jest.config.ts
└── package.json
```

---

## 5. Data Models

### 5.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  VIEWER
  ANALYST
  ADMIN
}

enum RecordType {
  INCOME
  EXPENSE
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(VIEWER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  records   FinancialRecord[]
}

model FinancialRecord {
  id        String     @id @default(uuid())
  amount    Decimal    @db.Decimal(12, 2)
  type      RecordType
  category  String
  date      DateTime
  notes     String?
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  deletedAt DateTime?  // null = active | set = soft deleted
}
```

### 5.2 User Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | String (UUID) | Auto | Primary key, generated by Prisma |
| `email` | String | Yes | Unique, used as login identifier |
| `password` | String | Yes | bcrypt hashed, never returned in API responses |
| `name` | String | Yes | Display name |
| `role` | Enum (Role) | Yes | `VIEWER` \| `ANALYST` \| `ADMIN` |
| `isActive` | Boolean | Auto | Defaults `true`; `false` = deactivated |
| `createdAt` | DateTime | Auto | Prisma managed timestamp |
| `updatedAt` | DateTime | Auto | Prisma managed timestamp |

### 5.3 FinancialRecord Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | String (UUID) | Auto | Primary key |
| `amount` | Decimal(12,2) | Yes | Stored as Decimal for financial precision |
| `type` | Enum (RecordType) | Yes | `INCOME` \| `EXPENSE` |
| `category` | String | Yes | Free-form e.g. Salary, Rent, Travel |
| `date` | DateTime | Yes | Date of the transaction |
| `notes` | String? | No | Optional description, max 500 chars |
| `userId` | String (FK) | Yes | Reference to `User.id` |
| `createdAt` | DateTime | Auto | Prisma managed |
| `updatedAt` | DateTime | Auto | Prisma managed |
| `deletedAt` | DateTime? | Auto | `NULL` = active; set = soft deleted |

> **Soft Delete Strategy:** All queries filter `WHERE deletedAt IS NULL` by default. The DELETE endpoint sets `deletedAt` to the current timestamp instead of removing the row, preserving audit history.

---

## 6. Role & Permission Matrix

Access control is enforced at the middleware layer using the `requireRole()` guard. It reads the role from the JWT payload and rejects unauthorized requests with **HTTP 403** before the controller is reached.

```typescript
// src/middleware/authorize.ts
export const requireRole = (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    next();
  };
```

| Action / Permission | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| View dashboard summary | ✓ | ✓ | ✓ |
| View own financial records | ✓ | ✓ | ✓ |
| Filter & search records | ✗ | ✓ | ✓ |
| View all users' records | ✗ | ✓ | ✓ |
| View analytics & insights | ✗ | ✓ | ✓ |
| Create financial records | ✗ | ✗ | ✓ |
| Update financial records | ✗ | ✗ | ✓ |
| Soft delete records | ✗ | ✗ | ✓ |
| Manage users (CRUD) | ✗ | ✗ | ✓ |
| Assign / change roles | ✗ | ✗ | ✓ |

---

## 7. API Endpoints

### 7.1 Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user (default role: VIEWER) |
| `POST` | `/api/auth/login` | Public | Login, returns JWT access token |
| `GET` | `/api/auth/me` | Authenticated | Get current user profile |

### 7.2 Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | List all users with pagination |
| `GET` | `/api/users/:id` | Admin | Get single user by ID |
| `PATCH` | `/api/users/:id/role` | Admin | Update a user's role |
| `PATCH` | `/api/users/:id/status` | Admin | Toggle user active/inactive |
| `DELETE` | `/api/users/:id` | Admin | Deactivate a user account |

### 7.3 Financial Records

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/records` | Analyst, Admin | List all records with filters + pagination |
| `GET` | `/api/records/my` | All roles | List own records |
| `GET` | `/api/records/:id` | Analyst, Admin | Get single record by ID |
| `POST` | `/api/records` | Admin | Create a new financial record |
| `PUT` | `/api/records/:id` | Admin | Update a financial record |
| `DELETE` | `/api/records/:id` | Admin | Soft delete a record |

**Supported query parameters on `GET /api/records`:**

| Parameter | Example | Description |
|---|---|---|
| `type` | `?type=INCOME` | Filter by record type |
| `category` | `?category=Salary` | Filter by category (partial match) |
| `from` | `?from=2025-01-01` | Start date filter |
| `to` | `?to=2025-12-31` | End date filter |
| `search` | `?search=groceries` | Full-text search on notes + category |
| `page` | `?page=1` | Page number (default: 1) |
| `limit` | `?limit=20` | Results per page (default: 20, max: 100) |

### 7.4 Dashboard

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | All roles | Total income, expenses, net balance |
| `GET` | `/api/dashboard/categories` | Analyst, Admin | Income & expense breakdown by category |
| `GET` | `/api/dashboard/trends` | Analyst, Admin | Monthly income vs expense (past 12 months) |
| `GET` | `/api/dashboard/recent` | All roles | Last 10 financial records |
| `GET` | `/api/dashboard/top-categories` | Analyst, Admin | Top 5 spending categories |

> **Dashboard Query Strategy:** All aggregations use single PostgreSQL queries with `GROUP BY`, `SUM`, and `DATE_TRUNC`. No application-layer loops. Monthly trends use `DATE_TRUNC('month', date)` with `SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END)` for income vs expense in one pass.

---

## 8. API Response Format

All endpoints return a consistent JSON envelope via the `ApiResponse` utility.

### Success Response

```json
{
  "success": true,
  "message": "Records fetched successfully",
  "data": { },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "FORBIDDEN",
  "statusCode": 403
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|---|---|---|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST (new resource) |
| `400` | Bad Request | Validation failure |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Valid JWT but insufficient role |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate email on register |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unhandled exception |

---

## 9. Authentication Flow

Authentication uses **stateless JWT**. The token is signed with a secret, contains the user's ID and role, and has a configurable expiry (default: 7 days).

```
1. POST /api/auth/login  { email, password }
2. Service: find user by email → bcrypt.compare(password, hash)
3. If inactive user → 401 Unauthorized
4. Sign JWT: { userId, role, email } + secret + expiry
5. Return: { token, user }
6. Client: store token → send as Authorization: Bearer <token>
7. authenticate.ts: verify signature → attach user to req
8. authorize.ts: check req.user.role → 403 if insufficient
```

**JWT Payload structure:**

```json
{
  "userId": "uuid-here",
  "role": "ADMIN",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234654890
}
```

---

## 10. Input Validation Rules

Validation uses `express-validator`'s `body()` chain, co-located with routes. The `validate.ts` middleware collects **all** validation errors and returns them in a single `400` response — not just the first failure.

### 10.1 Auth Endpoints

| Field | Rules |
|---|---|
| `email` | Required, valid email format |
| `password` | Required, minimum 8 characters |
| `name` | Required, min 2 chars, max 100 chars |

### 10.2 Financial Records

| Field | Rules |
|---|---|
| `amount` | Required, positive number, max 2 decimal places |
| `type` | Required, must be `INCOME` or `EXPENSE` |
| `category` | Required, non-empty string, max 100 chars |
| `date` | Required, valid ISO 8601 date string |
| `notes` | Optional, max 500 characters |

### 10.3 User Management

| Field | Rules |
|---|---|
| `role` | Must be one of `VIEWER`, `ANALYST`, `ADMIN` |
| `isActive` | Must be boolean |

---

## 11. Optional Enhancements

All seven optional enhancements from the assignment are in scope.

| Enhancement | Implementation | Effort | Impact |
|---|---|---|---|
| JWT Authentication | `jsonwebtoken` + `bcryptjs` | 2–3 hrs | High |
| Pagination | `?page=&limit=` query params | 1 hr | Medium |
| Search Support | Prisma `contains` filter | 1 hr | Medium |
| Soft Delete | `deletedAt` field + query filter | 1 hr | High |
| Rate Limiting | `express-rate-limit` middleware | 30 min | Medium |
| Unit Tests | Jest + Supertest | 3–4 hrs | High |
| API Docs | `swagger-jsdoc` + `swagger-ui-express` | 2 hrs | High |

---

## 12. Build Timeline

Estimated 7-day plan at 4–6 focused hours per day.

| Day | Focus | Key Deliverables |
|---|---|---|
| Day 1 | Project Setup + Auth | Prisma schema, DB connection, User model, JWT middleware, `/auth` routes |
| Day 2 | Financial Records CRUD | Records model, CRUD endpoints, role guards, soft delete |
| Day 3 | Dashboard APIs | Aggregation queries, summary endpoints, category & monthly trends |
| Day 4 | Filters, Pagination & Search | Query params on records, search by notes/category, pagination |
| Day 5 | Validation + Error Handling | express-validator rules, global error handler, `ApiError` class, status codes |
| Day 6 | Tests + Swagger Docs | Jest test suite, Supertest integration tests, Swagger annotations |
| Day 7 | README + Deploy | Comprehensive README, Railway/Render deploy, final cleanup |

---

## 13. Assumptions & Decisions

### 13.1 Role Assumptions

- `VIEWER` can only see their own records via `/api/records/my` — not the full records list
- `ANALYST` can view all records and all dashboard data but cannot mutate anything
- `ADMIN` has full CRUD access to records and full user management capability
- The seed script creates one `ADMIN` account (`admin@finance.dev` / `Admin@1234`) for evaluation convenience

### 13.2 Data Assumptions

- Amounts stored as `Decimal(12,2)` — supports values up to 9,999,999,999.99
- All dates stored as UTC and returned as ISO 8601 strings
- `category` is a free-form string — no predefined enum — giving flexibility for diverse record types
- Soft-deleted records are excluded from all dashboard calculations and record listings

### 13.3 Auth Assumptions

- Single access token (no refresh token) — sufficient for assessment scope
- Inactive users (`isActive: false`) receive 401 on login even with correct credentials
- Password reset is out of scope for this submission

---

## 14. README Structure

The `README.md` is the primary evaluator entry point and must allow them to run and test the API within 5 minutes.

- Project overview and full feature list
- Prerequisites (Node 20, PostgreSQL or Docker)
- Setup: `clone → .env → pnpm install → prisma migrate → seed → pnpm dev`
- Environment variables table (reference to `.env.example`)
- Role permission matrix
- API endpoint reference with example `curl` commands
- Link to live Swagger docs (`/api/docs`)
- Database schema description
- Testing instructions (`pnpm test`)
- Deployment notes (Railway / Render)
- Assumptions and tradeoffs section

---

## 15. Evaluation Criteria Mapping

| Criteria | How This Project Addresses It |
|---|---|
| **Backend Design** | Module-based folder structure; strict separation of routes, controllers, services, and middleware |
| **Logical Thinking** | RBAC middleware, soft delete, PostgreSQL aggregation queries for dashboard — not JS loops |
| **Functionality** | All 5 core features + all 7 optional enhancements implemented and tested |
| **Code Quality** | TypeScript strict mode, consistent naming, no `any` types, Prisma typed queries throughout |
| **Data Modeling** | Prisma schema with UUID PKs, `Decimal` for amounts, enums for roles/types, soft delete column |
| **Validation & Reliability** | `express-validator` on every mutation route; custom `ApiError` class; global error handler |
| **Documentation** | Swagger at `/api/docs`; comprehensive README; assumptions clearly documented in this PRD |
| **Thoughtfulness** | Seed data, rate limiting, consistent response envelope, inactive user guard on login |

---

*FinSight API PRD · x0lg0n · April 2026 · v1.0*