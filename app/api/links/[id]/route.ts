import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

async function authAndFetch(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, link: null, isAdmin: false }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const res = await fetch(
    `${supabaseUrl}/rest/v1/links?id=eq.${id}&limit=1`,
    { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } },
  )
  const data = await res.json()
  const link = data[0] ?? null
  const isAdmin = !!(ADMIN_EMAIL && user.email === ADMIN_EMAIL)
  return { user, link, isAdmin }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { user, link, isAdmin } = await authAndFetch(id)

  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!link) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (!isAdmin && link.user_id !== user.id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  return NextResponse.json(link)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { user, link, isAdmin } = await authAndFetch(id)

  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!link) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (!isAdmin && link.user_id !== user.id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const body = await req.json()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(`${supabaseUrl}/rest/v1/links?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      destination_url: body.destination_url,
      og_title: body.og_title || null,
      og_description: body.og_description || null,
      og_image: body.og_image || null,
      landing_title: body.landing_title || null,
      landing_description: body.landing_description || null,
      landing_image: body.landing_image || null,
      button_text: body.button_text || null,
      redirect_method: body.redirect_method || 'js_href',
    }),
  })

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status })
  const updated = await res.json()
  return NextResponse.json(updated[0] ?? {})
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { user, link, isAdmin } = await authAndFetch(id)

  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!link) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (!isAdmin && link.user_id !== user.id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(`${supabaseUrl}/rest/v1/links?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
  })

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status })
  return new NextResponse(null, { status: 204 })
}
