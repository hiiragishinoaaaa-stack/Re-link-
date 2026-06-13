import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/admin'

  // Only allow ASCII-safe internal paths in the redirect target so that a
  // crafted ?next= value can never inject non-ASCII bytes into the Location
  // header (which must be a ByteString).
  const next = /^\/[a-zA-Z0-9/_?=&#%-]*$/.test(nextParam) ? nextParam : '/admin'

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
