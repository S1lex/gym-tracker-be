/**
 * Stripe Controller
 * 
 * Handles Stripe-related endpoints including Customer Portal session creation
 */

import { Response } from 'express';
import Stripe from 'stripe';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../types';
import { config } from '../config/config';
import {
  getOrCreateStripeCustomerId,
} from '../services/revenueCatService';

// Initialize Stripe
let stripe: Stripe | null = null;
if (config.stripe.secretKey) {
  stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-11-17.clover', // Use latest stable API version
  });
} else {
  console.warn('⚠️  Stripe not initialized - STRIPE_SECRET_KEY not set');
}

/**
 * POST /api/stripe/create-portal-session
 * 
 * Creates a Stripe Customer Portal session for managing subscriptions
 * 
 * Request body:
 * - returnUrl (optional): URL to redirect to after portal session ends
 * 
 * Returns:
 * - url: The Customer Portal URL
 */
export const createPortalSession = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ url: string }>>
): Promise<void> => {
  try {
    if (!stripe) {
      res.status(503).json({
        success: false,
        error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      });
      return;
    }

    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    if (!userEmail) {
      res.status(400).json({
        success: false,
        error: 'User email is required',
      });
      return;
    }

    // Get return URL from request body or use default
    const returnUrl =
      req.body.returnUrl ||
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8081');

    // Get or create Stripe customer ID
    // First try to get from RevenueCat, then create if needed
    let stripeCustomerId = await getOrCreateStripeCustomerId(
      userId,
      userEmail,
      stripe
    );

    // If we still don't have a customer ID, try to find it by email in Stripe
    if (!stripeCustomerId) {
      try {
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
          console.log('Found Stripe customer by email:', stripeCustomerId);
        }
      } catch (error) {
        console.warn('Error searching for Stripe customer by email:', error);
      }
    }

    if (!stripeCustomerId) {
      res.status(500).json({
        success: false,
        error: 'Failed to get or create Stripe customer. Please ensure you have completed a purchase.',
      });
      return;
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    res.json({
      success: true,
      data: {
        url: portalSession.url,
      },
    });
  } catch (error: any) {
    console.error('Error creating Stripe portal session:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({
        success: false,
        error: error.message || 'Invalid request to Stripe',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create portal session',
    });
  }
};

/**
 * GET /api/stripe/config
 * 
 * Returns Stripe publishable key (if configured)
 * This can be used by the frontend to initialize Stripe.js
 */
export const getStripeConfig = async (
  _req: AuthRequest,
  res: Response<ApiResponse<{ publishableKey?: string }>>
): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        publishableKey: config.stripe.publishableKey,
      },
    });
  } catch (error: any) {
    console.error('Error getting Stripe config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Stripe configuration',
    });
  }
};

/**
 * GET /api/stripe/subscription-status
 * 
 * Gets subscription status directly from Stripe
 * Used on Web platform (iOS/Android use RevenueCat SDK)
 */
export const getSubscriptionStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ hasPro: boolean; activeEntitlements: string[] }>>
): Promise<void> => {
  try {
    if (!stripe) {
      res.status(503).json({
        success: false,
        error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      });
      return;
    }

    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    // Get or create Stripe customer ID
    // For Web purchases, Stripe creates customers during checkout, so search by email first
    let stripeCustomerId = await getOrCreateStripeCustomerId(
      userId,
      userEmail || '',
      stripe
    );

    // If not found, try searching by email directly (in case customer was created during checkout)
    // IMPORTANT: Only use customers that are linked to this user ID via metadata
    if (!stripeCustomerId && userEmail) {
      try {
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 10, // Get multiple in case there are duplicates
        });
        
        if (customers.data.length > 0) {
          // Find customer that matches this user ID in metadata
          const matchingCustomer = customers.data.find(
            customer => customer.metadata?.app_user_id === userId
          );
          
          if (matchingCustomer) {
            // Found customer linked to this user
            stripeCustomerId = matchingCustomer.id;
            console.log(`Found Stripe customer by email linked to user ${userId}: ${stripeCustomerId}`);
          } else {
            // No customer found with matching user ID
            // Don't use any customer - they might belong to a different account
            console.log(`Found Stripe customers by email but none match user ${userId}. Not using them.`);
            stripeCustomerId = null;
          }
        }
      } catch (searchError) {
        console.warn('Error searching for customer by email:', searchError);
      }
    }

    if (!stripeCustomerId) {
      console.log(`No Stripe customer found for user ${userId} (email: ${userEmail})`);
      res.json({
        success: true,
        data: {
          hasPro: false,
          activeEntitlements: [],
        },
      });
      return;
    }

    // Get active subscriptions from Stripe
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 100,
    });

    // Check if user has any active subscription
    const hasPro = activeSubscriptions.data.length > 0;
    
    console.log(`📊 Subscription status check for customer ${stripeCustomerId}:`, {
      activeSubscriptions: activeSubscriptions.data.length,
      hasPro,
    });
    
    const activeEntitlements = activeSubscriptions.data.map((sub) => sub.id);

    res.json({
      success: true,
      data: {
        hasPro,
        activeEntitlements,
      },
    });
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status',
    });
  }
};

/**
 * GET /api/stripe/products
 * 
 * Gets products/prices directly from Stripe
 * Used on Web platform to display products in custom paywall
 * (Web uses Stripe directly, iOS/Android use RevenueCat)
 */
export const getProducts = async (
  _req: AuthRequest,
  res: Response<ApiResponse<Array<{
    id: string;
    name: string;
    description: string | null;
    prices: Array<{
      id: string;
      unitAmount: number;
      currency: string;
      recurring: {
        interval: 'month' | 'year';
        intervalCount: number;
      } | null;
      type: 'recurring' | 'one_time';
    }>;
  }>>>
): Promise<void> => {
  try {
    if (!stripe) {
      res.status(503).json({
        success: false,
        error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      });
      return;
    }

    // Fetch active products from Stripe
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // Fetch prices for each product
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          prices: prices.data.map((price) => ({
            id: price.id,
            unitAmount: price.unit_amount || 0,
            currency: price.currency,
            recurring: price.recurring
              ? {
                  interval: price.recurring.interval as 'month' | 'year',
                  intervalCount: price.recurring.interval_count,
                }
              : null,
            type: (price.type === 'recurring' ? 'recurring' : 'one_time') as 'recurring' | 'one_time',
          })),
        };
      })
    );

    // Filter out products without prices
    const productsWithValidPrices = productsWithPrices.filter(
      (product) => product.prices.length > 0
    );

    res.json({
      success: true,
      data: productsWithValidPrices,
    });
  } catch (error: any) {
    console.error('Error getting Stripe products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products',
    });
  }
};

/**
 * POST /api/stripe/create-checkout-session
 * 
 * Creates a Stripe Checkout session for purchasing a subscription
 * Used on Web platform for custom paywall
 */
export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ url: string; sessionId: string }>>
): Promise<void> => {
  try {
    if (!stripe) {
      res.status(503).json({
        success: false,
        error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      });
      return;
    }

    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const { priceId, productId } = req.body;

    if (!userId || !userEmail) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    if (!priceId) {
      res.status(400).json({
        success: false,
        error: 'Price ID is required',
      });
      return;
    }

    // Get return URL from request body or use default
    const successUrl =
      req.body.successUrl ||
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8081');
    
    const cancelUrl =
      req.body.cancelUrl ||
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8081');

    // Get or create Stripe customer ID
    const stripeCustomerId = await getOrCreateStripeCustomerId(
      userId,
      userEmail,
      stripe
    );

    if (!stripeCustomerId) {
      res.status(500).json({
        success: false,
        error: 'Failed to get or create Stripe customer',
      });
      return;
    }

    // Determine if this is a one-time payment or subscription
    // Check the price type from Stripe
    let mode: 'payment' | 'subscription' = 'subscription';
    try {
      const price = await stripe.prices.retrieve(priceId);
      mode = price.type === 'one_time' ? 'payment' : 'subscription';
    } catch (error) {
      console.warn('Could not retrieve price info, defaulting to subscription mode');
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        app_user_id: userId,
        product_id: productId || '',
      },
    });

    res.json({
      success: true,
      data: {
        url: session.url || '',
        sessionId: session.id,
      },
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);

    if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({
        success: false,
        error: error.message || 'Invalid request to Stripe',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
    });
  }
};

/**
 * GET /api/stripe/verify-checkout-session
 * 
 * Verifies a Stripe checkout session and returns payment status
 * Used after Stripe redirects back to the app
 */
export const verifyCheckoutSession = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ 
    status: string; 
    sessionId: string;
    customerId?: string;
    paymentStatus?: string;
    error?: string;
  }>>
): Promise<void> => {
  try {
    if (!stripe) {
      res.status(503).json({
        success: false,
        error: 'Stripe is not configured',
      });
      return;
    }

    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'subscription'],
    });

    // Verify the session belongs to the current user
    const userId = req.user?.id;
    if (session.metadata?.app_user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Session does not belong to this user',
      });
      return;
    }

    // Determine payment status
    let status = 'unknown';
    let paymentStatus = 'unknown';
    let error: string | undefined;

    if (session.payment_status === 'paid') {
      status = 'success';
      paymentStatus = 'paid';
    } else if (session.payment_status === 'unpaid') {
      status = 'failed';
      paymentStatus = 'unpaid';
      error = 'Payment was not completed';
    } else if (session.status === 'expired') {
      status = 'failed';
      paymentStatus = 'expired';
      error = 'Checkout session expired';
    } else if (session.status === 'complete') {
      // When session is complete, payment_status can be 'paid' or 'no_payment_required'
      status = 'success';
      paymentStatus = (session.payment_status as string) || 'unknown';
    } else {
      status = 'failed';
      paymentStatus = session.payment_status || 'unknown';
      error = `Payment status: ${session.payment_status || 'unknown'}`;
    }

    res.json({
      success: true,
      data: {
        status,
        sessionId: session.id,
        customerId: session.customer as string | undefined,
        paymentStatus,
        error,
      },
    });
  } catch (error: any) {
    console.error('Error verifying checkout session:', error);

    if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({
        success: false,
        error: error.message || 'Invalid session ID',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to verify checkout session',
    });
  }
};

