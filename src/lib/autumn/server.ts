// Server-side Autumn utilities
import { createClient } from '@/lib/supabase/server';

interface AutumnUsage {
  balance: number;
  used: number;
  limit: number;
  tier?: string;
}

// Get credit usage from Autumn (server-side)
export async function getAutumnUsage(userId: string): Promise<AutumnUsage> {
  try {
    // Check if we have AUTUMN_BACKEND_URL configured
    const backendUrl = process.env.AUTUMN_BACKEND_URL || 'https://api.useautumn.com';

    const response = await fetch(`${backendUrl}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTUMN_SECRET_KEY}`
      },
      body: JSON.stringify({
        customerId: userId,
        featureId: 'credits'
      })
    });

    if (!response.ok) {
      console.error('Autumn API error:', response.status, await response.text());
      // Return default values if Autumn is not configured
      return {
        balance: 1000, // Default free tier
        used: 0,
        limit: 1000,
        tier: 'free'
      };
    }

    const data = await response.json();

    return {
      balance: data.remaining || 0,
      used: data.used || 0,
      limit: data.limit || 0,
      tier: data.tier || 'free'
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
    const backendUrl = process.env.AUTUMN_BACKEND_URL || 'https://api.useautumn.com';

    const response = await fetch(`${backendUrl}/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTUMN_SECRET_KEY}`
      },
      body: JSON.stringify({
        customerId: userId
      })
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Autumn subscription:', error);
    return null;
  }
}