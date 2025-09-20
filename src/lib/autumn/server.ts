// Server-side Autumn utilities
// Direct API calls to Autumn since autumn-js package has Next.js 14 compatibility issues

interface AutumnUsage {
  balance: number;
  used: number;
  limit: number;
  tier?: string;
}

// Helper to call Autumn API directly
async function callAutumnAPI(endpoint: string, body: any) {
  const response = await fetch(`https://api.useautumn.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AUTUMN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error(`Autumn API error: ${response.status} ${response.statusText}`);
    return null;
  }

  try {
    return await response.json();
  } catch (error) {
    console.error('Failed to parse Autumn API response:', error);
    return null;
  }
}

// Get credit usage from Autumn (server-side)
export async function getAutumnUsage(userId: string): Promise<AutumnUsage> {
  try {
    // Call Autumn API directly
    const result = await callAutumnAPI('/check', {
      customer_id: userId,
      feature_id: 'credits',
      with_preview: true
    });

    if (!result) {
      return {
        balance: 1000,
        used: 0,
        limit: 1000,
        tier: 'free'
      };
    }

    // Extract balance information
    const balance = result?.balance || 1000;
    const limit = result?.limit || 1000;
    const used = limit - balance;

    return {
      balance: balance,
      used: used,
      limit: limit,
      tier: result?.tier || 'free'
    };
  } catch (error) {
    console.error('Error getting Autumn usage:', error);
    // Return default values if Autumn is not available
    return {
      balance: 1000,
      used: 0,
      limit: 1000,
      tier: 'free'
    };
  }
}

// Get subscription info from Autumn
export async function getAutumnSubscription(userId: string) {
  try {
    // Query customer data directly from Autumn
    const result = await callAutumnAPI('/query', {
      customer_id: userId
    });

    // Extract subscription/product info from the query response
    return result?.subscription || null;
  } catch (error) {
    console.error('Error getting Autumn subscription:', error);
    return null;
  }
}