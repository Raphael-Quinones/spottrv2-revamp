// Server-side Autumn credit utilities
// These are used by API routes to check and track credit usage
// Direct API calls to Autumn since autumn-js package has Next.js 14 compatibility issues

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
    console.error(`Autumn API error (${response.status}) at ${endpoint}`);
    return { data: null, ok: false, status: response.status };
  }

  try {
    const data = await response.json();
    return { data, ok: true, status: response.status };
  } catch (error) {
    console.error('Failed to parse Autumn API response:', error);
    return { data: null, ok: false, status: response.status };
  }
}

// Check if user has sufficient credits
export async function checkAutumnCredits(
  userId: string,
  requiredCredits: number
): Promise<{ allowed: boolean; balance: number; message?: string }> {
  try {
    const { data, ok } = await callAutumnAPI('/check', {
      customer_id: userId,
      feature_id: 'credits',
      value: requiredCredits
    });

    return {
      allowed: data?.allowed || false,
      balance: data?.remaining || 0,
      message: data?.message
    };
  } catch (error) {
    console.error('Error checking Autumn credits:', error);
    return {
      allowed: false,
      balance: 0,
      message: 'Failed to check credit balance'
    };
  }
}

// Track credit usage
export async function trackAutumnCredits(
  userId: string,
  creditsUsed: number,
  metadata?: {
    operation: string;
    videoId?: string;
    description?: string;
    inputTokens?: number;
    outputTokens?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, ok } = await callAutumnAPI('/track', {
      customer_id: userId,
      feature_id: 'credits',
      value: creditsUsed,
      metadata
    });

    if (!ok || data?.error) {
      return { success: false, error: data?.error?.message || 'Failed to track credits' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking Autumn credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track credits'
    };
  }
}

// Get current credit balance
export async function getAutumnBalance(userId: string): Promise<number> {
  try {
    const { data } = await callAutumnAPI('/check', {
      customer_id: userId,
      feature_id: 'credits'
    });

    return data?.balance || 0;
  } catch (error) {
    console.error('Error getting Autumn balance:', error);
    return 0;
  }
}