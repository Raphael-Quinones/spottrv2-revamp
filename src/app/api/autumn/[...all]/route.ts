import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// Ultra-minimal proxy for Autumn API
// Simply forwards all requests to Autumn and returns the response
async function handler(request: NextRequest) {
  // Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Extract the path after /api/autumn
  const url = new URL(request.url);
  let path = url.pathname.replace('/api/autumn', '');

  // Special handling for billing portal - replace 'me' with actual customer ID
  if (path === '/customers/me/billing_portal' && user?.id) {
    path = `/customers/${user.id}/billing_portal`;
  }

  // Get request body if it exists
  let body = null;
  if (request.method === 'POST') {
    try {
      body = await request.json();
      // Auto-inject user details if not present
      if (user && body) {
        body.customer_id = body.customer_id || user.id;
        body.customer_email = body.customer_email || user.email;
      }
    } catch {
      // No body or not JSON
    }
  }

  // Forward to Autumn API
  const autumnResponse = await fetch(
    `https://api.useautumn.com/v1${path}${url.search}`,
    {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${process.env.AUTUMN_API_KEY}`,
        'Content-Type': 'application/json',
        ...(user?.id && { 'X-Customer-Id': user.id })
      },
      body: body ? JSON.stringify(body) : undefined
    }
  );

  // Return Autumn's response as-is
  const data = await autumnResponse.text();
  return new Response(data, {
    status: autumnResponse.status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const GET = handler;
export const POST = handler;