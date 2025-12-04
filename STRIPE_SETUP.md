# Stripe Customer Portal Setup Guide

This guide explains how to set up the Stripe Customer Portal for managing subscriptions in the GymTracker app.

## Overview

The Stripe Customer Portal allows users to manage their subscriptions (cancel, update payment methods, view invoices) through a hosted Stripe interface. This is particularly useful for Web subscriptions managed through RevenueCat + Stripe.

## Prerequisites

1. **Stripe Account**: You need a Stripe account with API access
2. **RevenueCat Integration**: Stripe must be connected to your RevenueCat project
3. **Environment Variables**: Configure Stripe keys in your backend

## Setup Steps

### 1. Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Developers** > **API keys**
3. Copy your **Secret key** (starts with `sk_`)
4. Copy your **Publishable key** (starts with `pk_`) - Optional, for frontend use

### 2. Configure Environment Variables

Add the following to your backend `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Optional: Your Stripe publishable key

# RevenueCat Configuration (for getting Stripe customer IDs)
REVENUECAT_API_KEY=test_SMhrfGJMPdClnNqnYKzmDBDZqQk  # Your RevenueCat API key
```

**Important**: 
- Use `sk_test_...` for development/testing
- Use `sk_live_...` for production
- Never commit these keys to version control

### 3. Configure Stripe Customer Portal

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) > **Settings** > **Billing** > **Customer portal**
2. Configure the portal settings:
   - **Business information**: Add your business name and logo
   - **Features**: Enable what customers can do:
     - ✅ Update payment methods
     - ✅ Cancel subscriptions
     - ✅ Update billing details
     - ✅ View invoices
   - **Branding**: Customize colors and styling
3. Save your configuration

### 4. Connect RevenueCat to Stripe

1. In RevenueCat Dashboard, go to **Integrations** > **Stripe**
2. Connect your Stripe account
3. Enable **Web Billing** for your products
4. Ensure your RevenueCat products are linked to Stripe prices

### 5. Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Test the portal session creation:
   ```bash
   curl -X POST http://localhost:3000/api/stripe/create-portal-session \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"returnUrl": "http://localhost:8081"}'
   ```

3. You should receive a response with a `url` field containing the portal session URL

## How It Works

### Flow

1. **User clicks "Manage Subscription"** on Web platform
2. **Frontend calls** `POST /api/stripe/create-portal-session`
3. **Backend**:
   - Gets user ID from JWT token
   - Retrieves or creates Stripe customer ID (via RevenueCat or directly)
   - Creates a Stripe billing portal session
   - Returns the portal URL
4. **Frontend opens** the portal URL in a new window
5. **User manages** subscription in Stripe's hosted portal
6. **Stripe webhooks** notify RevenueCat of changes
7. **RevenueCat syncs** subscription status back to your app

### Customer ID Resolution

The backend tries to get the Stripe customer ID in this order:

1. **From RevenueCat**: Checks RevenueCat API for existing Stripe customer ID
2. **Create New**: If not found, creates a new Stripe customer with:
   - User's email
   - Metadata linking to RevenueCat user ID

### API Endpoints

#### `POST /api/stripe/create-portal-session`

Creates a Stripe Customer Portal session.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "returnUrl": "http://localhost:8081"  // Optional: URL to return to after portal
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/p/session/..."
  }
}
```

#### `GET /api/stripe/config`

Returns Stripe configuration (publishable key).

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "success": true,
  "data": {
    "publishableKey": "pk_test_..."
  }
}
```

## Troubleshooting

### Error: "Stripe is not configured"

**Solution**: Make sure `STRIPE_SECRET_KEY` is set in your `.env` file and restart the server.

### Error: "Failed to get or create Stripe customer"

**Possible causes**:
- RevenueCat API key is incorrect
- User doesn't exist in RevenueCat
- Stripe API key is invalid

**Solution**: 
- Verify your RevenueCat API key
- Check that the user has made at least one purchase
- Verify your Stripe secret key is correct

### Portal URL doesn't open

**Solution**: 
- Check browser console for errors
- Verify the `returnUrl` is a valid URL
- Ensure Stripe Customer Portal is configured in Stripe Dashboard

### Customer ID not found in RevenueCat

**Solution**: 
- This is normal for new users
- The backend will create a new Stripe customer automatically
- Ensure RevenueCat is properly connected to Stripe

## Security Considerations

1. **Never expose secret keys**: Only use `STRIPE_SECRET_KEY` on the backend
2. **Use HTTPS**: Always use HTTPS in production
3. **Validate users**: The endpoint requires authentication
4. **Rate limiting**: Consider adding rate limiting to prevent abuse
5. **Monitor usage**: Check Stripe Dashboard for unusual activity

## Production Checklist

- [ ] Use production Stripe keys (`sk_live_...`)
- [ ] Configure Stripe Customer Portal branding
- [ ] Set up Stripe webhooks for subscription events
- [ ] Test with real subscriptions
- [ ] Monitor error logs
- [ ] Set up alerts for failed portal sessions

## Additional Resources

- [Stripe Customer Portal Documentation](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe API Reference](https://stripe.com/docs/api)
- [RevenueCat Stripe Integration](https://www.revenuecat.com/docs/integrations/stripe)

