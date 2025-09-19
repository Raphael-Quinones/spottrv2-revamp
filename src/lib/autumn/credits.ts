// Server-side Autumn credit utilities
// These are used by API routes to check and track credit usage

const AUTUMN_BACKEND_URL = process.env.AUTUMN_BACKEND_URL || 'https://api.useautumn.com';
const AUTUMN_SECRET_KEY = process.env.AUTUMN_SECRET_KEY;

// Check if user has sufficient credits
export async function checkAutumnCredits(
  userId: string,
  requiredCredits: number
): Promise<{ allowed: boolean; balance: number; message?: string }> {
  try {
    const response = await fetch(`${AUTUMN_BACKEND_URL}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTUMN_SECRET_KEY}`
      },
      body: JSON.stringify({
        customerId: userId,
        featureId: 'credits',
        value: requiredCredits
      })
    });

    const data = await response.json();

    return {
      allowed: data.allowed || false,
      balance: data.remaining || 0,
      message: data.message
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
    const response = await fetch(`${AUTUMN_BACKEND_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTUMN_SECRET_KEY}`
      },
      body: JSON.stringify({
        customerId: userId,
        featureId: 'credits',
        value: creditsUsed,
        metadata
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
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

// Get current credit balance (uses custom balance route)
export async function getAutumnBalance(userId: string): Promise<number> {
  try {
    const response = await fetch('/api/autumn/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: userId })
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error('Error getting Autumn balance:', error);
    return 0;
  }
}