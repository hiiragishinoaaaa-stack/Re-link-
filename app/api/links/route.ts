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

// Validate protocol and return the URL's normalized, percent-encoded href.
// Returns null when the URL is invalid or uses a non-http(s) scheme.
function normalizeUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.href
  } catch {
    return null
  }
}

// ── Diagnostic helpers ────────────────────────────────────────────────────────

function logField(label: string, val: unknown) {
  if (typeof val !== 'string') {
    console.log(`[create-link]   ${label}: (${typeof val}) ${JSON.stringify(val)}`)
    return
  }
  // Scan for the first character with code > 255 (ByteString boundary).
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i)
    if (code > 255) {
      console.error(
        `[create-link] ⚠ BYTESTRING VIOLATION  field="${label}"  index=${i}  charCode=${code}  char="${val.charAt(i)}"`,
      )
      console.error(`[create-link]   full value (JSON): ${JSON.stringify(val)}`)
      return
    }
  }
  // Truncate long values for readability.
  const display = val.length > 120 ? `${JSON.stringify(val.slice(0, 120))}…` : JSON.stringify(val)
  console.log(`[create-link]   ${label}: ${display}`)
}

// ── POST handler wrapped in a full error boundary ─────────────────────────────

export async function POST(req: NextRequest) {
  try {
    return await handlePost(req)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const stack   = err instanceof Error ? (err.stack ?? message) : message
    console.error('[create-link] !! UNHANDLED EXCEPTION:', stack)
    return NextResponse.json({ error: message, _debug_stack: stack }, { status: 500 })
  }
}

async function handlePost(req: NextRequest) {
  // ── Step 1: read body as raw text so we can log BEFORE any HTTP requests ──
  const rawText = await req.text()
  console.log('[create-link] raw body (first 500 chars):', rawText.slice(0, 500))

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  // ── Step 2: log + inspect every submitted field for ByteString violations ──
  console.log('[create-link] submitted fields:')
  const FIELDS = [
    'slug', 'destination_url',
    'og_title', 'og_description', 'og_image',
    'landing_title', 'landing_description', 'landing_image',
    'button_text',
  ] as const
  for (const f of FIELDS) logField(f, body[f])

  // ── Step 3: auth (this is the first outgoing HTTP call) ────────────────────
  console.log('[create-link] calling getAuthUser...')
  const user = await getAuthUser()
  console.log('[create-link] getAuthUser done, user.id =', user?.id ?? '(null)')
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

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

  const cleanDest = normalizeUrl(destination_url.trim())
  if (!cleanDest) {
    return NextResponse.json(
      { error: 'destination_url must start with http:// or https://.' },
      { status: 400 },
    )
  }

  const rawOgImage = typeof og_image === 'string' ? og_image.trim() : ''
  const cleanOgImage = rawOgImage ? normalizeUrl(rawOgImage) : null
  if (rawOgImage && !cleanOgImage) {
    return NextResponse.json(
      { error: 'og_image must be a valid http:// or https:// URL.' },
      { status: 400 },
    )
  }

  const rawLandingImage = typeof landing_image === 'string' ? landing_image.trim() : ''
  const cleanLandingImage = rawLandingImage ? normalizeUrl(rawLandingImage) : null
  if (rawLandingImage && !cleanLandingImage) {
    return NextResponse.json(
      { error: 'landing_image must be a valid http:// or https:// URL.' },
      { status: 400 },
    )
  }

  // ── Step 4: Supabase insert (second outgoing HTTP call) ────────────────────
  console.log('[create-link] calling supabase insert, cleanDest=', cleanDest,
    'cleanOgImage=', cleanOgImage, 'cleanLandingImage=', cleanLandingImage)

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

  console.log('[create-link] insert done, error=', error?.message ?? 'none')

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That slug is already taken.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
