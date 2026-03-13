import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * DELETE /api/account
 *
 * Permanently deletes the authenticated user's account and associated data.
 * Required for App Store: apps that support account creation must offer
 * account deletion in-app (see Apple's "Offering account deletion in your app").
 *
 * Subscription check: Callers must ensure the user has no active paid
 * subscription before calling. If the user has an active subscription,
 * the client must prompt them to cancel it first (e.g. via App Store
 * subscription management) per Apple's guidelines.
 */
router.delete(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId, false);

      if (error) {
        console.error('[Account] deleteUser failed:', error.message);
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to delete account',
        });
        return;
      }

      res.status(200).json({ success: true, message: 'Account deleted' });
    } catch (err: any) {
      console.error('[Account] delete error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to delete account',
      });
    }
  }
);

export default router;
