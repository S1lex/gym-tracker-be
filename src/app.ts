import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { config } from './config/config';
import apiRoutes from './routes/api';
import i18nRouter from './routes/i18n';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Express = express();

// Trust proxy (important for rate limiting and security behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware with production-optimized settings
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Compression middleware (gzip responses)
app.use(compression());

// CORS configuration
// Note: React Native apps don't send origin headers, but web clients do
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins for easier testing
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    // In production, restrict to allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];
    
    // If no allowed origins configured, allow all (for mobile apps)
    // For web clients, you should configure ALLOWED_ORIGINS env var
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
if (config.nodeEnv !== 'development') {
  // General API rate limiter
  const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: { success: false, error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  });

  // Stricter rate limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: { success: false, error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);
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

// Debug: Log registered routes in development
if (config.nodeEnv === 'development') {
  console.log('✅ API routes registered at /api');
}

// Also register i18n routes directly at /i18n for easier testing (optional)
// This allows both /api/i18n/es/common.json and /i18n/es/common.json to work
app.use('/i18n', i18nRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
