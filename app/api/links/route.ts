import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL

  // Admin sees all links; regular users see only their own.
  const db = isAdmin ? getSupabaseAdmin() : await createSupabaseServerClient()
  const query = db.from('links').select('*').order('created_at', { ascending: false })
  const { data, error } = isAdmin
    ? await query
    : await query.eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Slugs that must never be registered.
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'auth', 'login', 'signup', 'go',
  '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
])

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const {
    slug, destination_url,
    og_title, og_description, og_image,
    landing_title, landing_description, landing_image, button_text,
  } = body

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug is required.' }, { status: 400 })
  }
  if (!destination_url || typeof destination_url !== 'string') {
    return NextResponse.json({ error: 'destination_url is required.' }, { status: 400 })
  }

  const cleanSlug = slug.trim().toLowerCase()
  if (!/^[a-zA-Z0-9-_]+$/.test(cleanSlug)) {
    return NextResponse.json(
      { error: 'Slug may only contain letters, numbers, hyphens, and underscores.' },
      { status: 400 },
    )
  }
  if (RESERVED_SLUGS.has(cleanSlug)) {
    return NextResponse.json({ error: 'That slug is reserved.' }, { status: 400 })
  }

  const cleanDest = destination_url.trim()
  if (!isSafeUrl(cleanDest)) {
    return NextResponse.json(
      { error: 'destination_url must start with http:// or https://.' },
      { status: 400 },
    )
  }

  const cleanOgImage = typeof og_image === 'string' ? og_image.trim() : ''
  if (cleanOgImage && !isSafeUrl(cleanOgImage)) {
    return NextResponse.json(
      { error: 'og_image must be a valid http:// or https:// URL.' },
      { status: 400 },
    )
  }

  const cleanLandingImage = typeof landing_image === 'string' ? landing_image.trim() : ''
  if (cleanLandingImage && !isSafeUrl(cleanLandingImage)) {
    return NextResponse.json(
      { error: 'landing_image must be a valid http:// or https:// URL.' },
      { status: 400 },
    )
  }

  // Use admin client to bypass RLS for insert (RLS policy enforces user_id server-side).
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('links')
    .insert({
      slug: cleanSlug,
      destination_url: cleanDest,
      og_title: typeof og_title === 'string' ? og_title.trim() || null : null,
      og_description: typeof og_description === 'string' ? og_description.trim() || null : null,
      og_image: cleanOgImage || null,
      landing_title: typeof landing_title === 'string' ? landing_title.trim() || null : null,
      landing_description: typeof landing_description === 'string' ? landing_description.trim() || null : null,
      landing_image: cleanLandingImage || null,
      button_text: typeof button_text === 'string' ? button_text.trim() || null : null,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That slug is already taken.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
