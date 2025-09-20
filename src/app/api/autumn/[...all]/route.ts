import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// Custom handler since autumn-js has compatibility issues with Next.js 14
// The package uses CommonJS which doesn't work properly with Next.js 14's ES modules

// Helper to get authenticated user
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper to call Autumn API
async function callAutumnAPI(path: string, method: string, body?: any, userId?: string) {
  const autumnUrl = `https://api.useautumn.com/v1${path}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${process.env.AUTUMN_API_KEY}`,
    'Content-Type': 'application/json',
  };

  // Add customer ID header if we have a user
  if (userId) {
    headers['X-Customer-Id'] = userId;
  }

  const response = await fetch(autumnUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Check if response is ok before parsing
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Autumn API error (${response.status}) at ${path}:`, errorText.substring(0, 500));

    // Try to parse error as JSON if possible
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: true, message: errorText.substring(0, 200) };
    }

    return {
      data: errorData,
      status: response.status
    };
  }

  // Parse JSON response
  try {
    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    console.error('Failed to parse Autumn API response as JSON:', error);
    return {
      data: {
        error: true,
        message: 'Invalid JSON response from Autumn API'
      },
      status: response.status
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    // Get the path after /api/autumn/
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const autumnPath = pathSegments.slice(2).join('/'); // Remove 'api', 'autumn' and keep the rest

    // Build the full path with query params
    const fullPath = autumnPath ? `/${autumnPath}${url.search}` : `${url.search}`;

    // Call Autumn API
    const { data, status } = await callAutumnAPI(fullPath, 'GET', null, user?.id);

    return Response.json(data, { status });
  } catch (error) {
    console.error('Autumn API GET error:', error);
    return Response.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the path after /api/autumn/
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const autumnPath = pathSegments.slice(2).join('/'); // Remove 'api', 'autumn' and keep the rest

    // Get request body
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // No body or not JSON
    }

    // Get authenticated user (not required for all endpoints)
    const user = await getAuthenticatedUser();

    // Build the full path
    const fullPath = autumnPath ? `/${autumnPath}${url.search}` : `${url.search}`;

    // Special handling for different endpoints
    if (autumnPath === 'check' || autumnPath === 'track' || autumnPath === 'query') {
      // These endpoints need customer_id in the body
      if (!body) body = {};
      if (!body.customer_id && !body.customerId) {
        body.customer_id = user?.id;
      }
    } else if (autumnPath === 'attach' || autumnPath === 'checkout') {
      // Attach/checkout endpoint for payment/subscription management
      if (!body) body = {};

      // Ensure customer_id is set from authenticated user or from request body
      if (!body.customer_id) {
        body.customer_id = user?.id;
      }
      if (!body.customer_email) {
        body.customer_email = user?.email;
      }

      // Add success and cancel URLs if not provided
      if (!body.success_url) {
        body.success_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;
      }
      if (!body.cancel_url) {
        body.cancel_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`;
      }
    }

    // Call Autumn API
    const { data, status } = await callAutumnAPI(fullPath, 'POST', body, user?.id);

    // For attach/checkout, handle the redirect URL
    if ((autumnPath === 'attach' || autumnPath === 'checkout') && data?.url) {
      // The client will handle the redirect
      return Response.json(data, { status });
    }

    return Response.json(data, { status });
  } catch (error) {
    console.error('Autumn API POST error:', error);
    return Response.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}