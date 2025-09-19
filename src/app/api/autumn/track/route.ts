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

    const { featureId, value, metadata } = await request.json();

    // Make request to Autumn backend
    const response = await fetch(`${process.env.AUTUMN_BACKEND_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTUMN_SECRET_KEY}`
      },
      body: JSON.stringify({
        customerId: user.id,
        featureId,
        value,
        metadata
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to track credits: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error tracking Autumn credits:', error);
    return NextResponse.json(
      { error: 'Failed to track credits' },
      { status: 500 }
    );
  }
}