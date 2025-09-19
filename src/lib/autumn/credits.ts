// Autumn credit utilities
import { calculateCredits as calculateCreditsFromTokens } from '@/lib/credit-utils';

// Check if user has sufficient credits via Autumn
export async function checkAutumnCredits(
  customerId: string,
  requiredCredits: number
): Promise<{ allowed: boolean; balance: number; message?: string }> {
  try {
    const response = await fetch('/api/autumn/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        featureId: 'credits',
        value: requiredCredits
      })
    });

    const data = await response.json();

    return {
      allowed: data.allowed,
      balance: data.balance || 0,
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

// Track credit usage via Autumn
export async function trackAutumnCredits(
  customerId: string,
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
    const response = await fetch('/api/autumn/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
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

// Get current credit balance from Autumn
export async function getAutumnBalance(customerId: string): Promise<number> {
  try {
    const response = await fetch('/api/autumn/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId })
    });

    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error('Error getting Autumn balance:', error);
    return 0;
  }
}