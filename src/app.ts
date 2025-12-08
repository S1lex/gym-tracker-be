import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import apiRoutes from './routes/api';
import i18nRouter from './routes/i18n';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration - Allow requests from various sources
// Note: React Native apps don't typically need CORS (not browsers), but it's good to have this configured
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins for easier testing
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    // In production, allow all origins since this is a mobile app backend
    // Mobile apps don't send origin headers, but web clients might
    // You can restrict this further if needed by adding specific domains
    return callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - disabled in development mode for easier testing
if (config.nodeEnv !== 'development') {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', limiter);
} else {
  console.log('⚠️  Rate limiting is DISABLED in development mode');
}

// Root endpoint - provides API information
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Gym Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes (auth and exercises are public, workouts and sets are protected)
app.use('/api', apiRoutes);

// Also register i18n routes directly at /i18n for easier testing (optional)
// This allows both /api/i18n/es/common.json and /i18n/es/common.json to work
app.use('/i18n', i18nRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
