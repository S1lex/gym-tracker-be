# Direct Stripe Integration for Web Platform

## Overview

The Web platform now uses **Stripe directly** for subscription management, while iOS/Android continue to use RevenueCat SDK. This simplifies the Web implementation and removes the need for RevenueCat Web Billing setup.

## Architecture

### Web Platform (Stripe Direct)
- **Products**: Fetched directly from Stripe API
- **Paywall**: Custom UI displaying Stripe products/prices
- **Checkout**: Stripe Checkout sessions
- **Subscription Status**: Checked directly from Stripe subscriptions

### iOS/Android Platform (RevenueCat SDK)
- **Products**: Fetched via RevenueCat SDK
- **Paywall**: RevenueCat UI or custom UI
- **Checkout**: Native App Store/Play Store
- **Subscription Status**: Checked via RevenueCat SDK

## API Endpoints

### `GET /api/stripe/products`
**Purpose**: Get all active Stripe products with prices for Web paywall

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_xxx",
      "name": "Monthly Subscription",
      "description": "Monthly access to FitGuard Pro",
      "prices": [
        {
          "id": "price_xxx",
          "unitAmount": 999,
          "currency": "usd",
          "recurring": {
            "interval": "month",
            "intervalCount": 1
          },
          "type": "recurring"
        }
      ]
    }
  ]
}
```

### `GET /api/stripe/subscription-status`
**Purpose**: Check user's subscription status from Stripe (Web only)

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "hasPro": true,
    "activeEntitlements": ["sub_xxx"]
  }
}
```

### `POST /api/stripe/create-checkout-session`
**Purpose**: Create Stripe Checkout session for Web purchases

**Authentication**: Required

**Request Body**:
```json
{
  "priceId": "price_xxx",
  "productId": "prod_xxx",
  "successUrl": "http://localhost:8081",
  "cancelUrl": "http://localhost:8081"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/...",
    "sessionId": "cs_test_xxx"
  }
}
```

## Setup Requirements

### Stripe Configuration

1. **Create Products in Stripe Dashboard**:
   - Monthly Subscription (recurring, monthly)
   - Yearly Subscription (recurring, yearly)
   - Lifetime Subscription (one-time payment)

2. **Set Environment Variables**:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...  # Optional
   ```

3. **Configure Stripe Customer Portal** (for subscription management):
   - Go to Stripe Dashboard > Settings > Billing > Customer Portal
   - Enable features: Update payment methods, Cancel subscriptions, View invoices

### RevenueCat Configuration (iOS/Android Only)

- Keep RevenueCat configured for native platforms
- No Web Billing setup needed in RevenueCat
- Products should still be configured in RevenueCat for iOS/Android

## Frontend Implementation

### PaywallModal Component

The `PaywallModal` component automatically detects the platform:

- **Web**: Fetches products from `/api/stripe/products` and displays Stripe products
- **iOS/Android**: Uses RevenueCat SDK to fetch offerings

### Subscription Status Checking

The subscription store (`subscriptionStore.ts`) handles platform-specific logic:

- **Web**: Calls `/api/stripe/subscription-status`
- **iOS/Android**: Uses RevenueCat SDK `getCustomerInfo()`

## Benefits

1. **Simpler Web Implementation**: No need for RevenueCat Web Billing setup
2. **Direct Stripe Integration**: Full control over Stripe features
3. **Reduced Dependencies**: Fewer API calls and simpler flow
4. **Platform-Specific Optimization**: Each platform uses its best-suited solution

## Migration Notes

- **Removed**: RevenueCat Web Billing endpoints (`/api/stripe/offerings`)
- **Added**: Direct Stripe products endpoint (`/api/stripe/products`)
- **Updated**: Subscription status now checks Stripe directly for Web
- **Unchanged**: iOS/Android continue using RevenueCat SDK

## Testing

### Web Platform Testing

1. **Test Products Loading**:
   ```bash
   curl -X GET http://localhost:3000/api/stripe/products \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Test Checkout Session Creation**:
   ```bash
   curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"priceId": "price_xxx", "productId": "prod_xxx"}'
   ```

3. **Test Subscription Status**:
   ```bash
   curl -X GET http://localhost:3000/api/stripe/subscription-status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Stripe Test Cards

Use Stripe test cards for testing:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

See: https://stripe.com/docs/testing

## Troubleshooting

### Products Not Showing

- Verify products are created in Stripe Dashboard
- Check that products are marked as "Active"
- Ensure products have at least one active price

### Checkout Session Fails

- Verify `STRIPE_SECRET_KEY` is set correctly
- Check that price ID exists in Stripe
- Ensure Stripe account is in test mode (for development)

### Subscription Status Incorrect

- Verify user has completed a purchase
- Check Stripe Dashboard for active subscriptions
- Ensure customer ID is correctly linked

