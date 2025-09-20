import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (!authError && user) {
      // Check if user exists in the database
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      // If user doesn't exist, create them
      if (!existingUser) {
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
        })
      }

      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }
  }

  // Return to login if there's an error
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}