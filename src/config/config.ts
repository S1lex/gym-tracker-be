import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  jwtSecret: string;
  allowedOrigins?: string[];
  stripe: {
    secretKey: string;
    publishableKey?: string;
  };
  revenueCat: {
    apiKey: string; // SDK API key (for client-side)
    sandboxApiKey?: string; // Sandbox API key (for server-side REST API calls)
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

function getConfig(): Config {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Stripe and RevenueCat are optional but recommended for subscription features
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not set. Stripe Customer Portal will not work.');
  }
  if (!process.env.REVENUECAT_API_KEY) {
    console.warn('⚠️  REVENUECAT_API_KEY not set. RevenueCat SDK integration may not work.');
  }
  if (!process.env.REVENUECAT_SANDBOX_API_KEY) {
    console.warn('⚠️  REVENUECAT_SANDBOX_API_KEY not set. Server-side RevenueCat API calls may not work.');
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    supabase: {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    jwtSecret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production environment');
      }
      if (!secret || secret === 'default-secret-change-in-production') {
        console.warn('⚠️  Using default JWT_SECRET. Change this in production!');
      }
      return secret || 'default-secret-change-in-production';
    })(),
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : undefined,
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },
    revenueCat: {
      apiKey: process.env.REVENUECAT_API_KEY || '',
      sandboxApiKey: process.env.REVENUECAT_SANDBOX_API_KEY,
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '150', 10),
    },
  };
}

export const config = getConfig();

