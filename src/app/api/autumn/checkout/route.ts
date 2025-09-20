import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json();

    // Use the attach endpoint to purchase the product (which will create a checkout URL)
    const autumnResponse = await fetch(
      `https://api.useautumn.com/v1/attach`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AUTUMN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: user.id,
          product_id: body.product_id,
          success_url: body.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
          cancel_url: body.cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        })
      }
    );

    const data = await autumnResponse.json();

    console.log('Autumn attach response:', data);

    // Return the response including the checkout URL
    return new Response(JSON.stringify(data), {
      status: autumnResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}