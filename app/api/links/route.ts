import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  return Response.json({ links: [] })
}

export async function POST(req: NextRequest) {
  await req.json()
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized.' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(`${supabaseUrl}/rest/v1/links`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      slug: 'debug-test',
      destination_url: 'https://example.com',
      og_title: '',
      og_description: '',
      og_image: '',
      landing_title: '',
      landing_description: '',
      landing_image: '',
      button_text: 'Open',
      user_id: user.id,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return Response.json({ error: text }, { status: res.status })
  }

  const inserted = await res.json()
  return Response.json({ slug: inserted[0].slug }, { status: 201 })
}
