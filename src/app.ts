import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import route modules
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import recordsRoutes from './modules/records/records.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app: Express = express();

/**
 * Middleware - Security & Parsing
 */
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Middleware - Rate Limiting
 */
app.use(apiLimiter);

/** 
 * Root endpoint - simple welcome message
*/
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the FinSight API',
    version: '1.0.0',
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Documentation
 */
if (env.API_DOCS_ENABLED) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'FinSight API',
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );

  console.log('📚 Swagger documentation available at /api/docs');
}

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

/**
 * 404 Handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: 'NOT_FOUND',
    statusCode: 404,
  });
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

export default app;
