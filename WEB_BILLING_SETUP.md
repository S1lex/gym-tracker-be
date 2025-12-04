# Web Billing Setup Guide: RevenueCat + Stripe

This guide explains how to set up Web Billing for your GymTracker app using RevenueCat and Stripe.

## Overview

For Web Billing, you need to:
1. Create products and prices in Stripe
2. Link Stripe products to RevenueCat products
3. Configure Web Billing in RevenueCat
4. Ensure products are available in your offering

## Step-by-Step Setup

### Step 1: Create Products in Stripe

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com/
2. **Navigate to Products**: Go to **Products** in the left sidebar
3. **Create Products**: Create products matching your RevenueCat products:

   **For Monthly Subscription:**
   - Click **"+ Add product"**
   - Name: `Monthly Subscription` (or match your RevenueCat product name)
   - Description: `Monthly subscription to FitGuard Pro`
   - Pricing model: **Recurring**
   - Price: Enter your monthly price (e.g., `$9.99`)
   - Billing period: **Monthly**
   - Click **Save product**
   - **Copy the Price ID** (starts with `price_...`) - you'll need this!

   **For Yearly Subscription:**
   - Click **"+ Add product"**
   - Name: `Yearly Subscription`
   - Description: `Yearly subscription to FitGuard Pro`
   - Pricing model: **Recurring**
   - Price: Enter your yearly price (e.g., `$99.99`)
   - Billing period: **Yearly**
   - Click **Save product**
   - **Copy the Price ID** (starts with `price_...`)

   **For Lifetime Purchase:**
   - Click **"+ Add product"**
   - Name: `Lifetime Subscription`
   - Description: `Lifetime access to FitGuard Pro`
   - Pricing model: **One time**
   - Price: Enter your lifetime price (e.g., `$199.99`)
   - Click **Save product**
   - **Copy the Price ID** (starts with `price_...`)

### Step 2: Connect Stripe to RevenueCat

1. **Log in to RevenueCat Dashboard**: https://app.revenuecat.com/
2. **Navigate to Integrations**: Go to **Integrations** in the left sidebar
3. **Connect Stripe**:
   - Find **Stripe** in the integrations list
   - Click **Connect** or **Configure**
   - Follow the prompts to connect your Stripe account
   - Authorize RevenueCat to access your Stripe account

### Step 3: Link Stripe Products to RevenueCat Products

1. **Navigate to Products**: In RevenueCat Dashboard, go to **Products**
2. **Edit Each Product**:
   
   **For Monthly Product:**
   - Click on your monthly product (e.g., `monthly`)
   - Scroll to **Web Billing** section
   - Click **"Add Stripe Product"** or **"Link Stripe Price"**
   - Select the Stripe product/price you created for monthly
   - Save

   **For Yearly Product:**
   - Click on your yearly product (e.g., `yearly`)
   - Scroll to **Web Billing** section
   - Click **"Add Stripe Product"** or **"Link Stripe Price"**
   - Select the Stripe product/price you created for yearly
   - Save

   **For Lifetime Product:**
   - Click on your lifetime product (e.g., `lifetime`)
   - Scroll to **Web Billing** section
   - Click **"Add Stripe Product"** or **"Link Stripe Price"**
   - Select the Stripe product/price you created for lifetime
   - Save

### Step 4: Verify Products in Offering

1. **Navigate to Offerings**: In RevenueCat Dashboard, go to **Offerings**
2. **Edit Your Offering** (e.g., `default_offering`):
   - Ensure all three products (monthly, yearly, lifetime) are added to packages
   - Verify each package has the correct Stripe product linked
   - Save the offering

### Step 5: Test the Integration

1. **Start your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test the offerings endpoint**:
   ```bash
   curl -X GET http://localhost:3000/api/stripe/offerings?offering=default_offering \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Verify response includes Stripe price IDs**:
   The response should include `stripePriceId` for each product:
   ```json
   {
     "success": true,
     "data": {
       "identifier": "default_offering",
       "packages": [
         {
           "identifier": "monthly",
           "product": {
             "identifier": "monthly",
             "title": "Monthly Subscription",
             "priceString": "$9.99",
             "stripePriceId": "price_xxxxx"
           }
         }
       ]
     }
   }
   ```

## Troubleshooting

### Issue: Stripe Price ID Not Found

**Problem**: Products don't have `stripePriceId` in the API response.

**Solution**:
1. Verify Stripe products are created and have Price IDs
2. Ensure Stripe is connected to RevenueCat
3. Check that each RevenueCat product has a Stripe product linked in Web Billing section
4. Wait a few minutes for RevenueCat to sync with Stripe

### Issue: Products Not Showing in Offering

**Problem**: Products exist but don't appear in the offering.

**Solution**:
1. Go to RevenueCat Dashboard > Offerings
2. Edit your offering (e.g., `default_offering`)
3. Ensure all products are added as packages
4. Save the offering

### Issue: Checkout Session Creation Fails

**Problem**: `POST /api/stripe/create-checkout-session` returns an error.

**Solution**:
1. Verify `STRIPE_SECRET_KEY` is set in backend `.env`
2. Check that the Stripe price ID exists in Stripe Dashboard
3. Ensure the price ID format is correct (starts with `price_`)
4. Verify Stripe account is in test mode (for development)

## Important Notes

1. **Test Mode vs Live Mode**:
   - Use Stripe test mode (`sk_test_...`) for development
   - Use Stripe live mode (`sk_live_...`) for production
   - Test cards: https://stripe.com/docs/testing

2. **Price ID Format**:
   - Stripe Price IDs start with `price_`
   - Example: `price_1OoZnQAll9xkprvc...`

3. **Web Billing Only**:
   - Stripe products are only needed for Web platform
   - iOS/Android use App Store/Play Store products
   - RevenueCat handles platform-specific product mapping

4. **Product Identifiers**:
   - Keep RevenueCat product identifiers consistent (e.g., `monthly`, `yearly`, `lifetime`)
   - These identifiers are used in your code

## Next Steps

After completing this setup:
1. Test the paywall on Web platform
2. Verify products load correctly
3. Test a purchase flow with Stripe test cards
4. Check that subscriptions appear in RevenueCat after purchase
5. Verify subscription status updates in your app

## Support Resources

- **RevenueCat Web Billing Docs**: https://www.revenuecat.com/docs/web-billing
- **Stripe Products Docs**: https://stripe.com/docs/products-prices
- **Stripe Testing**: https://stripe.com/docs/testing

