import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

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
