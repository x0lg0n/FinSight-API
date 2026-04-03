# Development Guide

## 🤝 Contributing & Extending

### Project Structure Reference

```folder
src/
├── app.ts                    # Express app setup & middleware chain
├── server.ts               # HTTP server entry point
├── config/
│   ├── env.ts             # Environment validation (fail fast)
│   ├── database.ts        # Prisma singleton
│   └── swagger.ts         # OpenAPI spec
├── middleware/
│   ├── authenticate.ts    # JWT verification
│   ├── authorize.ts       # Role-based guards
│   ├── validate.ts        # Input validation
│   ├── errorHandler.ts    # Global error handling
│   └── rateLimiter.ts     # Rate limiting
├── modules/               # Feature modules
│   ├── auth/              # Authentication
│   │   ├── auth.service.ts      → Business logic
│   │   ├── auth.controller.ts   → HTTP handlers
│   │   └── auth.routes.ts       → Route definitions
│   ├── users/             # User management
│   ├── records/           # Financial records CRUD
│   └── dashboard/         # Analytics
├── types/
│   └── index.ts           # Shared TypeScript types
└── utils/
    ├── ApiError.ts        # Error class & factory
    └── ApiResponse.ts     # Response wrapper

prisma/
├── schema.prisma          # Database schema (source of truth)
└── seed.ts                # Demo data

tests/
├── auth.test.ts
├── records.test.ts
└── dashboard.test.ts

docs/
├── README.md              # User-facing documentation
└── SUBMISSION.md          # Evaluation criteria mapping
```

---

## ➕ Adding a New Feature

### Example: Add "Budget" Feature

#### Step 1: Update Database Schema

```prisma
// prisma/schema.prisma
model Budget {
  id        String   @id @default(uuid())
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category  String
  limit     Decimal  @db.Decimal(12, 2)
  month     Int      // 1-12
  year      Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, category, month, year])
  @@index([userId])
}
```

```bash
npx prisma migrate dev --name add_budgets
```

#### Step 2: Create Service

```typescript
// src/modules/budgets/budgets.service.ts
export class BudetsService {
  static async createBudget(data: {
    userId: string;
    category: string;
    limit: Decimal;
    month: number;
    year: number;
  }) {
    // Validate month 1-12
    if (data.month < 1 || data.month > 12) {
      throw ErrorFactory.badRequest('Month must be 1-12');
    }

    // Check not duplicate
    const existing = await prisma.budget.findUnique({
      where: {
        userId_category_month_year: {
          userId: data.userId,
          category: data.category,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (existing) {
      throw ErrorFactory.conflict('Budget already exists for this period');
    }

    return prisma.budget.create({ data });
  }

  static async listBudgets(userId: string, year?: number) {
    return prisma.budget.findMany({
      where: {
        userId,
        ...(year && { year }),
      },
      orderBy: { month: 'asc' },
    });
  }

  static async getBudgetStatus(userId: string, category: string, month: number, year: number) {
    // Get budget limit
    const budget = await prisma.budget.findUnique({
      where: {
        userId_category_month_year: { userId, category, month, year },
      },
    });

    if (!budget) {
      return null; // No budget set
    }

    // Get actual spending for this month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const spending = await prisma.financialRecord.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        category,
        date: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      _sum: { amount: true },
    });

    return {
      limit: budget.limit,
      spent: spending._sum.amount || 0,
      remaining: budget.limit - (spending._sum.amount || 0),
      percentUsed: ((spending._sum.amount || 0) / budget.limit) * 100,
    };
  }
}
```

#### Step 3: Create Controller

```typescript
// src/modules/budgets/budgets.controller.ts
export class BudgetsController {
  static async createBudget(req: AuthRequest, res: Response) {
    const { category, limit, month, year } = req.body;

    const budget = await BudgetsService.createBudget({
      userId: req.user.id,
      category,
      limit: new Decimal(limit),
      month,
      year,
    });

    res
      .status(201)
      .json(ApiResponse.created('Budget created', budget));
  }

  static async listBudgets(req: AuthRequest, res: Response) {
    const { year } = req.query;

    const budgets = await BudgetsService.listBudgets(
      req.user.id,
      year ? parseInt(year as string) : undefined
    );

    res.json(ApiResponse.success('Budgets retrieved', budgets));
  }

  static async getBudgetStatus(req: AuthRequest, res: Response) {
    const { category, month, year } = req.query;

    const status = await BudgetsService.getBudgetStatus(
      req.user.id,
      category as string,
      parseInt(month as string),
      parseInt(year as string)
    );

    if (!status) {
      throw ErrorFactory.notFound('Budget not found for this period');
    }

    res.json(ApiResponse.success('Budget status', status));
  }
}
```

#### Step 4: Create Routes

```typescript
// src/modules/budgets/budgets.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { BudgetsController } from './budgets.controller';

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     tags: [Budgets]
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category: {type: string}
 *               limit: {type: number}
 *               month: {type: integer, minimum: 1, maximum: 12}
 *               year: {type: integer}
 */
router.post('/budgets', authenticate, asyncHandler(BudgetsController.createBudget));
router.get('/budgets', authenticate, asyncHandler(BudgetsController.listBudgets));
router.get('/budgets/status', authenticate, asyncHandler(BudgetsController.getBudgetStatus));

export default router;
```

#### Step 5: Register in Main App

```typescript
// src/app.ts
import budgetsRouter from './modules/budgets/budgets.routes';

app.use('/api', budgetsRouter);
```

#### Step 6: Add Tests

```typescript
// tests/budgets.test.ts
describe('Budgets', () => {
  test('should create budget', async () => {
    const token = await loginAsAdmin();
    
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Food',
        limit: 5000,
        month: 4,
        year: 2024
      });

    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe('Food');
  });

  test('should not allow duplicate budget', async () => {
    // Create first budget
    // Attempt second budget with same category/month/year
    // Expect 409 conflict
  });

  test('should calculate budget status correctly', async () => {
    // Create budget
    // Add some expense records
    // Check status calculation
  });
});
```

---

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Structure

```typescript
describe('Feature Name', () => {
  let testData: any;

  beforeAll(async () => {
    // Setup: Create test users, seed data
  });

  afterAll(async () => {
    // Cleanup: Remove test data, close connections
  });

  describe('Scenario', () => {
    test('should do something', async () => {
      // Arrange: Setup test state
      const user = await createTestUser({ role: 'ADMIN' });
      
      // Act: Call endpoint
      const response = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000 });
      
      // Assert: Verify results
      expect(response.status).toBe(201);
      expect(response.body.data.amount).toBe(1000);
    });
  });
});
```

### What to Test

```env
✅ Happy path (success cases)
✅ Authorization (role checks)
✅ Authentication (token validation)
✅ Validation (invalid inputs)
✅ Edge cases (boundary values)
✅ Error cases (exceptions)
❌ Don't test: external APIs, database internals
```

---

## 🔒 Adding New Roles

### 1. Update Enum

```prisma
// prisma/schema.prisma
enum Role {
  VIEWER
  ANALYST
  MANAGER        // New role
  ADMIN
}
```

### 2. Add Authorization Rules

```typescript
// src/middleware/authorize.ts
export const requireRole = (...roles: Role[]) => {
  // Already generic, no changes needed
};

// Usage in routes
router.get(
  '/reports',
  authenticate,
  requireRole(Role.MANAGER, Role.ADMIN),  // Managers and admins only
  asyncHandler(ReportsController.getReports)
);
```

### 3. Update Seed Data

```typescript
// prisma/seed.ts
await prisma.user.create({
  data: {
    email: 'manager@finance.dev',
    password: hashedPassword,
    name: 'Manager User',
    role: 'MANAGER',  // New role
  },
});
```

---

## 🐛 Debugging

### Enable Query Logging

```typescript
// src/config/database.ts
export const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
});
```

Restart server:

```bash
npm run dev
```

All SQL will print to console.

### Using VS Code Debugger

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/src/server.ts",
      "restart": true,
      "runtimeArgs": ["-r", "ts-node/register"],
      "console": "integratedTerminal"
    }
  ]
}
```

Then:

- Set breakpoints (click line number in editor)
- Press F5 to start
- Debugger will pause at breakpoints

### Common Issues

| Issue | Solution |

|-------|----------|
| "ECONNREFUSED" on database | Check if PostgreSQL is running: `docker-compose up` |
| "JWT expired" errors | Check system clock is correct |
| Tests timeout | Increase timeout: `jest.setTimeout(30000)` |
| Port 3000 already in use | Change PORT in .env or kill process: `lsof -i :3000` |

---

## 📊 Performance Optimization

### Add Query Performance Monitoring

```typescript
// src/config/database.ts
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  
  return result;
});
```

### Identify Slow Queries

```bash
# Enable PostgreSQL slow query logging
# In your PostgreSQL config (usually /etc/postgresql/postgresql.conf):
log_min_duration_statement = 1000  # Log queries > 1 second
```

### Add Missing Indexes

```prisma
// If you notice queries are slow on certain fields:
model FinancialRecord {
  // ...

  // Add composite index for common query pattern
  @@index([userId, date])
  
  // Add slow query optimization
  @@index([type, deletedAt])
}
```

Then migrate:

```bash
npx prisma migrate dev --name add_performance_indexes
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in .env
- [ ] Use strong JWT_SECRET (min 32 chars, random)
- [ ] Use strong database password
- [ ] Enable HTTPS (environment variable or reverse proxy)
- [ ] Set up database backups
- [ ] Run final test suite: `npm test`
- [ ] Check build: `npm run build`
- [ ] Review logs in production for errors
- [ ] Set up monitoring/alerting
- [ ] Document all custom modifications

See [README.md - Deployment](README.md#-deployment) for detailed instructions.

---

## 📝 Code Style Guide

### Naming Conventions

```typescript
// Classes: PascalCase
class AuthService { }
class UserController { }

// Functions/methods: camelCase
function validateEmail() { }
async getUser() { }

// Constants: UPPER_SNAKE_CASE
const DEFAULT_PAGE_SIZE = 20;
const JWT_EXPIRY = '7d';

// Files: kebab-case
auth.service.ts
user.controller.ts
error.middleware.ts

// Routes: lowercase-with-hyphens
/api/auth/register
/api/records/my/list
/api/dashboard/top-categories
```

### Formatting

We use Prettier. Auto-format:

```bash
npm run format
```

Or in VS Code:

- Install Prettier extension
- Set as default formatter
- Enable "Format on Save"

Key rules:

- 2-space indentation
- Single quotes for strings
- Trailing commas in multiline
- Max line length: 100

---

## 📚 References

- **Express.js:** `https://expressjs.com`
- **TypeScript:** `https://www.typescriptlang.org`
- **Prisma:** `https://www.prisma.io/docs`
- **PostgreSQL:** `https://www.postgresql.org/docs`
- **JWT:** `https://jwt.io`
- **OWASP:** `https://owasp.org/www-project-top-ten`

---

## ❓ FAQ for Developers

**Q: I added a new field to User. What do I do?**  
A:

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update TypeScript types if needed
4. Update validation rules in routes

**Q: How do I connect to the database directly?**  
A:

```bash
psql postgresql://postgres:postgres@localhost:5432/finance_db
```

**Q: Can I use raw SQL?**  
A:

```typescript
const result = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email = ${email}
`;
```

(But prefer Prisma when possible for type safety)

**Q: How do I run a specific test?**  
A:

```bash
npm test -- --testNamePattern="should create record"
```

**Q: Where do I put a utility function?**  
A:

- Global utilities → `src/utils/`
- Module-specific → `src/modules/{module}/utils/`

**Q: How do I add a new environment variable?**  
A:

1. Add to `.env.example` with comment
2. Add to `.env` with your value
3. Add validation in `src/config/env.ts`
4. Use with `process.env.YOUR_VAR`

---

Happy coding! 🚀
