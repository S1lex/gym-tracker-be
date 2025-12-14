/**
 * RevenueCat Service
 * 
 * Helper functions to interact with RevenueCat API
 * Used to get customer information including Stripe customer IDs
 */

import { config } from '../config/config';
import Stripe from 'stripe';

interface RevenueCatCustomer {
  request_date: string;
  request_date_ms: number;
  subscriber: {
    first_seen: string;
    last_seen: string;
    management_url?: string;
    original_app_user_id: string;
    original_application_id: string;
    other_purchases: Record<string, unknown>;
    subscriptions: Record<string, RevenueCatSubscription>;
    entitlements: Record<string, RevenueCatEntitlement>;
    non_subscriptions: Record<string, unknown>;
  };
}

interface RevenueCatSubscription {
  billing_issues_detected_at?: string;
  expires_date: string;
  grace_period_expires_date?: string;
  is_sandbox: boolean;
  original_purchase_date: string;
  period_type: string;
  purchase_date: string;
  store: string;
  unsubscribe_detected_at?: string;
  will_renew: boolean;
}

interface RevenueCatEntitlement {
  expires_date?: string;
  grace_period_expires_date?: string;
  product_identifier: string;
  purchase_date: string;
  is_active?: boolean;
}

// Export types for use in controllers
export type { RevenueCatCustomer, RevenueCatSubscription, RevenueCatEntitlement };

/**
 * Get customer info from RevenueCat API
 * This includes subscription details and Stripe customer ID (if available)
 */
export const getRevenueCatCustomer = async (
  appUserId: string
): Promise<RevenueCatCustomer | null> => {
  // Use Sandbox API key for server-side REST API calls (preferred)
  // Fall back to SDK API key if Sandbox key is not configured
  const apiKey = config.revenueCat.sandboxApiKey || config.revenueCat.apiKey;
  
  if (!apiKey) {
    console.warn('RevenueCat API key not configured. Please set REVENUECAT_SANDBOX_API_KEY or REVENUECAT_API_KEY');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Customer ${appUserId} not found in RevenueCat`);
        return null;
      }
      const errorText = await response.text();
      console.error(`RevenueCat API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data as RevenueCatCustomer;
  } catch (error) {
    console.error('Error fetching RevenueCat customer:', error);
    return null;
  }
};

/**
 * Get Stripe customer ID from RevenueCat customer data
 * RevenueCat stores Stripe customer IDs in the subscriber's attributes
 */
export const getStripeCustomerIdFromRevenueCat = async (
  appUserId: string
): Promise<string | null> => {
  const customer = await getRevenueCatCustomer(appUserId);
  if (!customer) {
    return null;
  }

  // RevenueCat stores Stripe customer ID in subscriber attributes
  // Check for Stripe customer ID in various possible locations
  const subscriber = customer.subscriber;
  
  // Check subscriber attributes for Stripe customer ID
  // RevenueCat stores it in attributes.$stripeCustomerId or similar
  const attributes = (subscriber as any).attributes;
  if (attributes) {
    // Try common attribute keys
    if (attributes.$stripeCustomerId) {
      return attributes.$stripeCustomerId;
    }
    if (attributes.stripeCustomerId) {
      return attributes.stripeCustomerId;
    }
    // Check if there's a Stripe attribute object
    if (attributes.stripe && attributes.stripe.customerId) {
      return attributes.stripe.customerId;
    }
  }

  // Check subscriptions for Stripe store and extract customer ID
  for (const [, subscription] of Object.entries(subscriber.subscriptions)) {
    if (subscription.store === 'stripe') {
      // The subscription might have customer ID in its metadata or in the subscription object
      const subscriptionData = subscription as any;
      
      // Try various possible locations for Stripe customer ID
      if (subscriptionData.customer_id) {
        return subscriptionData.customer_id;
      }
      if (subscriptionData.stripe_customer_id) {
        return subscriptionData.stripe_customer_id;
      }
      if (subscriptionData.metadata?.stripe_customer_id) {
        return subscriptionData.metadata.stripe_customer_id;
      }
      
      // Check if there's a purchase event with customer ID
      if (subscriptionData.latest_purchase && subscriptionData.latest_purchase.store === 'stripe') {
        const purchaseData = subscriptionData.latest_purchase as any;
        if (purchaseData.customer_id) {
          return purchaseData.customer_id;
        }
      }
    }
  }

  // Alternative: Check if RevenueCat provides management_url with Stripe customer ID
  if (subscriber.management_url) {
    // Extract customer ID from management URL if it's a Stripe portal URL
    const match = subscriber.management_url.match(/customers\/(cus_[a-zA-Z0-9]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
};

/**
 * Get or create Stripe customer ID for a user
 * First tries to get from RevenueCat, then creates one in Stripe if needed
 */
export const getOrCreateStripeCustomerId = async (
  appUserId: string,
  email: string,
  stripe: any // Stripe instance
): Promise<string | null> => {
  // First, try to get from RevenueCat (for iOS/Android users)
  const existingCustomerId = await getStripeCustomerIdFromRevenueCat(appUserId);
  if (existingCustomerId) {
    console.log(`Found Stripe customer ID from RevenueCat: ${existingCustomerId}`);
    return existingCustomerId;
  }

  // For Web purchases, Stripe creates customers automatically during checkout
  // Search for existing customer by email first, but ONLY use if it's linked to this user
  if (email) {
    try {
      const customers = await stripe.customers.list({
        email: email,
        limit: 10, // Get multiple to find the one matching this user
      });
      
      if (customers.data.length > 0) {
        // Find customer that matches this user ID in metadata
        const matchingCustomer = customers.data.find(
          (customer: Stripe.Customer) => customer.metadata?.app_user_id === appUserId
        );
        
        if (matchingCustomer) {
          console.log(`Found existing Stripe customer by email linked to user ${appUserId}: ${matchingCustomer.id}`);
          return matchingCustomer.id;
        } else {
          // Found customers but none match this user ID - don't use them
          // They might belong to a different account with the same email
          console.log(`Found Stripe customers by email but none match user ${appUserId}. Will create new customer.`);
        }
      }
    } catch (searchError) {
      console.warn('Error searching for Stripe customer by email:', searchError);
    }
  }

  // If not found, create a new Stripe customer
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        app_user_id: appUserId,
        revenuecat_user_id: appUserId,
      },
    });

    console.log(`Created new Stripe customer: ${customer.id}`);
    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return null;
  }
};

/**
 * Check if user has active PRO entitlement
 */
export const checkProEntitlement = async (appUserId: string): Promise<boolean> => {
  const customer = await getRevenueCatCustomer(appUserId);
  if (!customer) {
    return false;
  }

  const entitlements = customer.subscriber.entitlements;
  // Check for FitGuard Pro entitlement (case-insensitive, with fallback to PRO for backward compatibility)
  const proEntitlement = entitlements['FitGuard Pro'] || entitlements['fitguard pro'] || entitlements['FITGUARD PRO'] || entitlements['PRO'] || entitlements['pro'] || entitlements['Pro'];
  
  if (!proEntitlement) {
    return false;
  }

  // Check if entitlement is active
  // An entitlement is active if expires_date is in the future or doesn't exist (lifetime)
  if (!proEntitlement.expires_date) {
    return true; // Lifetime entitlement
  }

  const expiresDate = new Date(proEntitlement.expires_date);
  const now = new Date();
  return expiresDate > now;
};

/**
 * Get subscription status from RevenueCat
 * Returns customer info including active entitlements
 */
export const getSubscriptionStatus = async (appUserId: string) => {
  const customer = await getRevenueCatCustomer(appUserId);
  if (!customer) {
    return {
      hasPro: false,
      customerInfo: null,
      activeEntitlements: [],
    };
  }

  const entitlements = customer.subscriber.entitlements;
  const activeEntitlements = Object.entries(entitlements).filter(([, entitlement]) => {
    if (!entitlement.expires_date) {
      return true; // Lifetime entitlement
    }
    const expiresDate = new Date(entitlement.expires_date);
    return expiresDate > new Date();
  });

  const hasPro = await checkProEntitlement(appUserId);

  return {
    hasPro,
    customerInfo: customer,
    activeEntitlements: activeEntitlements.map(([entitlementKey]) => entitlementKey),
  };
};

interface RevenueCatOfferingResponse {
  offering?: {
    identifier: string;
    server_description?: string;
    metadata?: Record<string, any>;
    available_packages?: Array<{
      identifier: string;
      package_type: string;
      product: {
        identifier: string;
        description: string;
        title: string;
        price: number;
        price_string: string;
        currency_code: string;
        subscription_period?: string;
      };
    }>;
  };
  current_offering_id?: string;
}

/**
 * Get offerings from RevenueCat API
 * Returns products/packages from a specific offering
 */
export const getOfferings = async (offeringIdentifier?: string) => {
  if (!config.revenueCat.sandboxApiKey && !config.revenueCat.apiKey) {
    console.warn('RevenueCat API key not configured');
    return null;
  }

  // Use Sandbox API key for server-side REST API calls (preferred)
  // Fall back to SDK API key if Sandbox key is not configured
  const apiKey = config.revenueCat.sandboxApiKey || config.revenueCat.apiKey;

  try {
    // RevenueCat API endpoint for offerings
    const url = offeringIdentifier
      ? `https://api.revenuecat.com/v1/offerings/${encodeURIComponent(offeringIdentifier)}`
      : 'https://api.revenuecat.com/v1/offerings';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RevenueCat API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = (await response.json()) as RevenueCatOfferingResponse;
    
    // If requesting specific offering, return that offering
    if (offeringIdentifier && data.offering) {
      return {
        identifier: data.offering.identifier,
        serverDescription: data.offering.server_description || '',
        metadata: data.offering.metadata || {},
        packages: (data.offering.available_packages || []).map((pkg) => ({
          identifier: pkg.identifier,
          packageType: pkg.package_type,
          product: {
            identifier: pkg.product.identifier,
            description: pkg.product.description,
            title: pkg.product.title,
            price: pkg.product.price,
            priceString: pkg.product.price_string,
            currencyCode: pkg.product.currency_code,
            subscriptionPeriod: pkg.product.subscription_period,
            // Extract Stripe price ID from product metadata or store_product_id
            stripePriceId: (pkg.product as any).store_product_id || 
                          (pkg.product as any).stripe_price_id ||
                          (pkg.product as any).metadata?.stripe_price_id,
          },
        })),
      };
    }

    // If requesting all offerings, return current offering or all offerings
    if (data.current_offering_id) {
      // Get the current offering
      const currentOfferingResponse = await fetch(
        `https://api.revenuecat.com/v1/offerings/${data.current_offering_id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (currentOfferingResponse.ok) {
        const currentOfferingData = (await currentOfferingResponse.json()) as RevenueCatOfferingResponse;
        if (currentOfferingData.offering) {
          return {
            identifier: currentOfferingData.offering.identifier,
            serverDescription: currentOfferingData.offering.server_description || '',
            metadata: currentOfferingData.offering.metadata || {},
            packages: (currentOfferingData.offering.available_packages || []).map((pkg) => ({
              identifier: pkg.identifier,
              packageType: pkg.package_type,
              product: {
                identifier: pkg.product.identifier,
                description: pkg.product.description,
                title: pkg.product.title,
                price: pkg.product.price,
                priceString: pkg.product.price_string,
                currencyCode: pkg.product.currency_code,
                subscriptionPeriod: pkg.product.subscription_period,
              },
            })),
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching offerings from RevenueCat:', error);
    return null;
  }
};

