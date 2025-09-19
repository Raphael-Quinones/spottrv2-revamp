import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Make request to Autumn backend to get balance
    const response = await fetch(`${process.env.AUTUMN_BACKEND_URL}/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTUMN_SECRET_KEY}`
      },
      body: JSON.stringify({
        customerId: user.id,
        featureId: 'credits'
      })
    });

    const data = await response.json();

    // Return the balance
    return NextResponse.json({
      balance: data.remaining || 0,
      used: data.used || 0,
      limit: data.limit || 0
    });
  } catch (error) {
    console.error('Error getting Autumn balance:', error);
    return NextResponse.json(
      { error: 'Failed to get balance' },
      { status: 500 }
    );
  }
}