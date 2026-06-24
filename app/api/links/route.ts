import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized.' }, { status: 401 })

  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL

  if (isAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const res = await fetch(
      `${supabaseUrl}/rest/v1/links?select=*&order=created_at.desc`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } },
    )
    if (!res.ok) return Response.json({ error: await res.text() }, { status: res.status })
    return Response.json(await res.json())
  }

  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

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
        slug: body.slug,
        destination_url: body.destination_url,
        og_title: body.og_title || null,
        og_description: body.og_description || null,
        og_image: body.og_image || null,
        landing_title: body.landing_title || null,
        landing_description: body.landing_description || null,
        landing_image: body.landing_image || null,
        button_text: body.button_text || null,
        redirect_method: body.redirect_method || 'js_href',
        user_id: user.id,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      let parsed: { code?: string } = {}
      try { parsed = JSON.parse(text) } catch { /* ignore */ }
      if (parsed.code === '23505') {
        return Response.json({ error: 'duplicate_slug' }, { status: 409 })
      }
      return Response.json({ error: text }, { status: res.status })
    }

    const inserted = await res.json()
    return Response.json(
      { id: inserted[0].id, slug: inserted[0].slug, hasLanding: !!(inserted[0].landing_title) },
      { status: 201 },
    )

  } catch (error) {
    return Response.json({ error: String((error as Error).message) }, { status: 500 })
  }
}
