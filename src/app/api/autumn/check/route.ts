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

    const { featureId, value } = await request.json();

    // Make request to Autumn backend
    const response = await fetch(`${process.env.AUTUMN_BACKEND_URL}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTUMN_SECRET_KEY}`
      },
      body: JSON.stringify({
        customerId: user.id,
        featureId,
        value
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking Autumn credits:', error);
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    );
  }
}