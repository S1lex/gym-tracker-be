import { Request, Response } from 'express';
import { supabaseClient, supabaseAdmin } from '../utils/supabaseClient';
import { ApiResponse, RegisterRequest, LoginRequest, AuthResponse } from '../types';

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google
 * Returns OAuth URL for Google sign-in
 */
export const initiateGoogleOAuth = async (
  req: Request,
  res: Response<ApiResponse<{ url: string }>>
): Promise<void> => {
  try {
    const { redirectTo } = req.query;
    // Use environment variable for frontend URL, with fallback for development
    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8081');
    const redirectUrl = typeof redirectTo === 'string' ? redirectTo : `${frontendUrl}/auth/callback`;

    // Generate OAuth URL using Supabase
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to initiate Google OAuth',
      });
      return;
    }

    if (!data.url) {
      res.status(400).json({
        success: false,
        error: 'Failed to generate OAuth URL',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        url: data.url,
      },
    });
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback
 * Processes OAuth callback and returns session
 */
export const handleGoogleOAuthCallback = async (
  req: Request,
  res: Response<ApiResponse<AuthResponse>>
): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
      return;
    }

    // Exchange code for session
    const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to exchange code for session',
      });
      return;
    }

    if (!data.user || !data.session) {
      res.status(400).json({
        success: false,
        error: 'Failed to create session',
      });
      return;
    }

    // Check if profile exists, create if not
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    const isNewUser = !profile;
    
    if (isNewUser) {
      // Create profile for new user
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          username: data.user.email?.split('@')[0] || `user_${data.user.id.slice(0, 8)}`,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Continue anyway - profile can be created later
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email || '',
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
        is_new_user: isNewUser, // Indicate if this is a new registration
      },
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Register a new user
 * POST /api/auth/register
 * Uses Supabase Auth signUp to create a new user
 */
export const register = async (
  req: Request,
  res: Response<ApiResponse<AuthResponse>>
): Promise<void> => {
  try {
    const { email, password }: RegisterRequest = req.body;
    
    // Log the email being registered for debugging
    console.log('Registration attempt for email:', email);

    // Validate email
    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid email address',
      });
      return;
    }

    // Validate password
    if (!password) {
      res.status(400).json({
        success: false,
        error: 'Password is required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Note: We don't pre-check for duplicates here because:
    // 1. Supabase admin API doesn't have a simple getUserByEmail method
    // 2. listUsers() would be inefficient (returns all users)
    // 3. Supabase handles duplicates at the database level
    // 4. We'll check after signUp using the identities array (more reliable)

    // Create user with Supabase Auth
    // When email confirmation is enabled, signUp may return session as null
    // We'll use admin client to sign in immediately after registration to get a session
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    console.log('Registering user:', signUpData);
    console.log('Registering error:', signUpError); 

    if (signUpError) {
      // Improve error messages for common cases
      let errorMessage = signUpError.message;
      
      // Check for email sending errors
      // Supabase returns 'unexpected_failure' code with status 500 when email sending fails
      const isEmailSendError = signUpError.message.toLowerCase().includes('error sending confirmation email') ||
                               signUpError.message.toLowerCase().includes('error sending email') ||
                               signUpError.message.toLowerCase().includes('failed to send email') ||
                               (signUpError.code === 'unexpected_failure' && 
                                signUpError.status === 500 && 
                                signUpError.message.toLowerCase().includes('email')) ||
                               signUpError.code === 'email_rate_limit_exceeded' ||
                               signUpError.code === 'email_send_failed';
      
      // Check for duplicate email errors - Supabase returns various error codes/messages
      const duplicateEmailPatterns = [
        'already registered',
        'already exists',
        'User already registered',
        'email address is already registered',
      ];
      
      // Rate limit errors should NOT be treated as duplicate email errors
      const isRateLimit = signUpError.code === 'over_email_send_rate_limit' || 
                         signUpError.status === 429 ||
                         (signUpError.message.toLowerCase().includes('rate limit') && !isEmailSendError);
      
      const isDuplicateEmail = !isRateLimit && !isEmailSendError && (
        duplicateEmailPatterns.some(pattern => 
          signUpError.message.toLowerCase().includes(pattern.toLowerCase())
        ) || signUpError.status === 422
      );
      
      if (isEmailSendError) {
        // Email sending failed - this could mean:
        // 1. SMTP not configured in Supabase Dashboard
        // 2. Email service temporarily unavailable
        // 3. Rate limits exceeded
        // Check if user was still created despite email error
        if (signUpData?.user) {
          // User was created but email failed - allow registration to proceed
          // but log the email error for debugging
          console.warn('User created but email sending failed:', signUpError.message);
          console.warn('NOTE: Configure SMTP settings in Supabase Dashboard → Authentication → Email Templates');
          // Continue with registration flow below - don't return error
          // The user can still log in, they just won't receive a confirmation email
        } else {
          // User creation also failed - return helpful error message
          errorMessage = 'Unable to send confirmation email. Please check your email settings in Supabase or try again later. If this persists, contact support.';
          console.error('Email sending failed and user was not created:', signUpError);
          console.error('To fix: Configure SMTP in Supabase Dashboard → Project Settings → Auth → Email');
          res.status(503).json({
            success: false,
            error: errorMessage,
          });
          return;
        }
      } else if (isDuplicateEmail) {
        errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        res.status(400).json({
          success: false,
          error: errorMessage,
        });
        return;
      } else if (isRateLimit) {
        errorMessage = 'Too many registration attempts. Please wait a few minutes before trying again.';
        res.status(429).json({
          success: false,
          error: errorMessage,
        });
        return;
      } else if (signUpError.message.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address';
        res.status(400).json({
          success: false,
          error: errorMessage,
        });
        return;
      } else if (signUpError.message.includes('password')) {
        errorMessage = 'Password is too weak. Please use a stronger password (at least 6 characters).';
        res.status(400).json({
          success: false,
          error: errorMessage,
        });
        return;
      } else {
        // Other errors - return as-is
        res.status(400).json({
          success: false,
          error: errorMessage,
        });
        return;
      }
    }

    if (!signUpData.user) {
      res.status(400).json({
        success: false,
        error: 'Failed to create user',
      });
      return;
    }

    // IMPORTANT: Check for duplicate email registration
    // When email confirmation is enabled, Supabase returns a user object even for existing emails
    // but with empty identities array - this indicates the email is already registered
    const hasEmptyIdentities = signUpData.user.identities && signUpData.user.identities.length === 0;
    
    if (hasEmptyIdentities) {
      // Empty identities usually means duplicate email when email confirmation is enabled
      // However, it can also be a false positive for new unconfirmed users
      // To be safe, we'll check by trying to list users and see if there's a different user with this email
      // But since listUsers is inefficient, we'll rely on Supabase's error handling
      // and only block if we're very confident it's a duplicate
      console.log('Empty identities detected - might be duplicate email');
      
      // For now, we'll allow it to proceed - Supabase will prevent actual duplicates at DB level
      // The user will get an error if they try to register again with the same email
      // This is safer than blocking valid new registrations
    }

    // Get session - if signUp didn't return one (email confirmation required),
    // use admin client to sign in immediately (admin bypasses email confirmation)
    let session = signUpData.session;
    if (!session) {
      console.log('Session is null, signing in with admin client to get session...');
      
      // Small delay to ensure user record is fully ready (if needed)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try signing in with admin client (bypasses email confirmation)
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Admin sign-in error:', signInError);
        // User was created successfully but we can't get a session
        // This happens when email confirmation is required (even admin can't bypass in some Supabase configs)
        // Return success with message indicating email verification needed
        // Don't return session object with empty strings - return null instead
        res.status(201).json({
          success: true,
          message: 'Account created successfully! Please check your email to verify your account before logging in.',
          data: {
            user: {
              id: signUpData.user.id,
              email: signUpData.user.email || '',
            },
            session: null, // Return null instead of empty strings
          } as AuthResponse,
        });
        return;
      }

      if (!signInData?.session) {
        // Similar case - user created but no session
        res.status(201).json({
          success: true,
          message: 'Account created successfully! Please check your email to verify your account before logging in.',
          data: {
            user: {
              id: signUpData.user.id,
              email: signUpData.user.email || '',
            },
            session: null, // Return null instead of empty strings
          } as AuthResponse,
        });
        return;
      } else {
        session = signInData.session;
      }
    }

    // Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: signUpData.user.id,
        username: email.split('@')[0], // Default username from email
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Continue even if profile creation fails - it can be created later
    }

    // Send back the session data
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: signUpData.user.id,
          email: signUpData.user.email || '',
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 * Uses Supabase Auth signInWithPassword to authenticate the user
 */
export const login = async (
  req: Request,
  res: Response<ApiResponse<AuthResponse>>
): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({
        success: false,
        error: error.message || 'Invalid email or password',
      });
      return;
    }

    if (!data.user || !data.session) {
      res.status(401).json({
        success: false,
        error: 'Failed to create session',
      });
      return;
    }

    // Check if profile exists, create if not
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      // Create profile for user if it doesn't exist
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          username: data.user.email?.split('@')[0] || `user_${data.user.id.slice(0, 8)}`,
        });

      if (profileError) {
        console.error('Error creating profile during login:', profileError);
        // Continue anyway - profile can be created later
      }
    }

    // Send back the session data provided by Supabase
    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email || '',
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
