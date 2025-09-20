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
    // Use the /check endpoint which is provided by autumnHandler
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/autumn/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: userId,
        feature_id: 'credits',
        with_preview: true
      })
    });

    if (!response.ok) {
      console.error('Autumn check error:', response.status);
      // Return default values if Autumn is not configured
      return {
        balance: 1000, // Default free tier
        used: 0,
        limit: 1000,
        tier: 'free'
      };
    }

    const data = await response.json();

    // The /check endpoint returns balance info in the balance field
    const balance = data.balance?.balance || 1000;
    const limit = 1000; // Default, can be updated based on tier
    const used = limit - balance;

    return {
      balance: balance,
      used: used,
      limit: limit,
      tier: 'free' // Can be determined from product_preview if needed
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
    // Use the /query endpoint to get customer data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/autumn/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: userId
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Extract subscription/product info from the query response
    return data.subscription || null;
  } catch (error) {
    console.error('Error getting Autumn subscription:', error);
    return null;
  }
}