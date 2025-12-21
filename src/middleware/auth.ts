import { Request, Response, NextFunction } from 'express';
import { supabaseClient } from '../utils/supabaseClient';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Auth middleware to verify JWT tokens from Authorization header
 * Uses Supabase Auth getUser to validate the token and fetch user data
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authorization token provided',
      });
      return;
    }

    // Extract the JWT token from Authorization header
    const token = authHeader.substring(7);

    // Use Supabase Auth getUser to validate the token and fetch user data
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Attach the user object to req.user
    req.user = {
      id: user.id,
      email: user.email || '',
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional auth middleware - populates req.user if token is present
 * but doesn't fail if token is missing or invalid
 * Useful for routes that should work for both authenticated and unauthenticated users
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    // Extract the JWT token from Authorization header
    const token = authHeader.substring(7);

    // Use Supabase Auth getUser to validate the token and fetch user data
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      // Invalid token, continue without user
      next();
      return;
    }

    // Attach the user object to req.user if token is valid
    req.user = {
      id: user.id,
      email: user.email || '',
    };

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Continue without user if there's an error
    next();
  }
};
