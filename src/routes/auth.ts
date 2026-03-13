import { Router, Request, Response } from 'express';
import { supabaseAdmin, supabaseAnon } from '../config/supabase';

const router = Router();

/**
 * POST /api/auth/login
 * Email + password sign-in via Supabase.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (error || !data.session || !data.user) {
    res.status(401).json({ success: false, error: error?.message || 'Invalid credentials' });
    return;
  }

  res.json({
    success: true,
    data: {
      user: { id: data.user.id, email: data.user.email },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    },
  });
});

/**
 * POST /api/auth/register
 * Email + password sign-up via Supabase.
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  const { data, error } = await supabaseAnon.auth.signUp({ email, password });

  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }

  if (!data.user) {
    res.status(400).json({ success: false, error: 'Registration failed' });
    return;
  }

  const hasSession = data.session !== null && Boolean(data.session?.access_token);

  res.status(201).json({
    success: true,
    message: hasSession
      ? 'Account created successfully!'
      : 'Account created successfully! Please verify your email before logging in.',
    data: {
      user: { id: data.user.id, email: data.user.email },
      session: hasSession
        ? {
            access_token: data.session!.access_token,
            refresh_token: data.session!.refresh_token,
          }
        : null,
    },
  });
});

/**
 * GET /api/auth/google/callback
 * Exchanges a Supabase PKCE authorization code for a session.
 * Creates or updates the user profile on first sign-in.
 */
router.get('/google/callback', async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, error: 'Missing authorization code' });
    return;
  }

  const { data, error } = await supabaseAnon.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    res.status(400).json({ success: false, error: error?.message || 'Failed to exchange code for session' });
    return;
  }

  const isNewUser = data.user.created_at
    ? new Date(data.user.created_at).getTime() > Date.now() - 60_000
    : false;

  res.json({
    success: true,
    data: {
      user: { id: data.user.id, email: data.user.email },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      is_new_user: isNewUser,
    },
  });
});

/**
 * POST /api/auth/apple
 * Verifies the Apple identity token with Supabase and upserts the user profile.
 *
 * Body:
 *   identityToken  — JWT issued by Apple after native sign-in
 *   profile.email  — email returned by Apple (only on first sign-in)
 *   profile.fullName — display name returned by Apple (only on first sign-in)
 */
router.post('/apple', async (req: Request, res: Response): Promise<void> => {
  const { identityToken, profile } = req.body as {
    identityToken?: string;
    profile?: { email?: string; fullName?: string };
  };

  if (!identityToken) {
    res.status(400).json({ success: false, error: 'Missing identityToken' });
    return;
  }

  const { data, error } = await supabaseAnon.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
  });

  if (error || !data.session || !data.user) {
    res.status(401).json({ success: false, error: error?.message || 'Apple token verification failed' });
    return;
  }

  const isNewUser = data.user.created_at
    ? new Date(data.user.created_at).getTime() > Date.now() - 60_000
    : false;

  // On first sign-in Apple provides the user's name — persist it to user metadata
  if (isNewUser && profile?.fullName) {
    await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      user_metadata: {
        full_name: profile.fullName,
        provider: 'apple',
      },
    });
  }

  res.json({
    success: true,
    data: {
      user: { id: data.user.id, email: data.user.email ?? profile?.email ?? '' },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      is_new_user: isNewUser,
    },
  });
});

/**
 * POST /api/auth/logout
 * Signs out the current user from Supabase (invalidates the refresh token).
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    // Best-effort: revoke the user's session via the admin API
    const { data: userData } = await supabaseAdmin.auth.getUser(token).catch(() => ({ data: { user: null } }));
    if (userData.user) {
      await supabaseAdmin.auth.admin.signOut(userData.user.id, 'global').catch(() => undefined);
    }
  }

  res.json({ success: true });
});

export default router;
