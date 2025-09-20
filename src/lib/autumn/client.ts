// Client-side utilities for Autumn billing operations
// Since autumn-js/react's useAutumn hook is broken, we use direct API calls

interface CheckoutParams {
  productId: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface AttachParams {
  productId: string;
}

interface CheckParams {
  featureId?: string;
  productId?: string;
}

interface TrackParams {
  featureId: string;
  value?: number;
}

interface AutumnResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

// Checkout creates a Stripe checkout session for purchasing products
export async function checkout(params: CheckoutParams): Promise<AutumnResponse> {
  try {
    const response = await fetch('/api/autumn/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: params.productId,
        success_url: params.successUrl || `${window.location.origin}/dashboard`,
        cancel_url: params.cancelUrl || window.location.href,
      }),
    });

    const data = await response.json();

    // Handle both 'url' and 'checkout_url' fields
    const checkoutUrl = data.url || data.checkout_url;
    if (checkoutUrl) {
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
      return { data };
    }

    return data;
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      error: {
        message: 'Failed to create checkout session',
        code: 'checkout_failed'
      }
    };
  }
}

// Attach handles upgrades/downgrades for existing customers
export async function attach(params: AttachParams): Promise<AutumnResponse> {
  try {
    const response = await fetch('/api/autumn/attach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: params.productId,
      }),
    });

    const data = await response.json();

    // Handle both 'url' and 'checkout_url' fields for consistency
    if (data.checkout_url && !data.url) {
      data.url = data.checkout_url;
    }

    return data;
  } catch (error) {
    console.error('Attach error:', error);
    return {
      error: {
        message: 'Failed to attach product',
        code: 'attach_failed'
      }
    };
  }
}

// Check verifies feature access and usage limits
export async function check(params: CheckParams): Promise<AutumnResponse> {
  try {
    const response = await fetch('/api/autumn/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return await response.json();
  } catch (error) {
    console.error('Check error:', error);
    return {
      error: {
        message: 'Failed to check access',
        code: 'check_failed'
      }
    };
  }
}

// Track records usage events for billing
export async function track(params: TrackParams): Promise<AutumnResponse> {
  try {
    const response = await fetch('/api/autumn/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature_id: params.featureId,
        value: params.value || 1,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Track error:', error);
    return {
      error: {
        message: 'Failed to track usage',
        code: 'track_failed'
      }
    };
  }
}

// Cancel cancels a subscription
export async function cancel(productId: string): Promise<AutumnResponse> {
  try {
    const response = await fetch('/api/autumn/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Cancel error:', error);
    return {
      error: {
        message: 'Failed to cancel subscription',
        code: 'cancel_failed'
      }
    };
  }
}

// Open billing portal for managing subscriptions
export async function openBillingPortal(): Promise<AutumnResponse> {
  try {
    // Note: The actual Autumn API endpoint is /customers/{customer_id}/billing_portal
    // Our proxy will handle adding the customer_id from the authenticated user
    const response = await fetch('/api/autumn/customers/me/billing_portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        return_url: window.location.href
      }),
    });

    const data = await response.json();

    // Handle both 'url' and 'portal_url' fields
    const portalUrl = data.url || data.portal_url;
    if (portalUrl) {
      // Redirect to Stripe billing portal
      window.location.href = portalUrl;
      return { data };
    }

    return data;
  } catch (error) {
    console.error('Billing portal error:', error);
    return {
      error: {
        message: 'Failed to open billing portal',
        code: 'portal_failed'
      }
    };
  }
}

// Query for customer data including subscriptions and usage
export async function query(params?: any): Promise<AutumnResponse> {
  try {
    const response = await fetch('/api/autumn/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });

    return await response.json();
  } catch (error) {
    console.error('Query error:', error);
    return {
      error: {
        message: 'Failed to query customer data',
        code: 'query_failed'
      }
    };
  }
}