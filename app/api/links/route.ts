import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Slugs that must never be registered — they shadow Next.js internals or
// built-in routes that users expect to work normally.
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
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
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const { slug, destination_url, og_title, og_description, og_image } = body

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

  // og_image is optional but if provided must also be a safe URL
  const cleanImage = typeof og_image === 'string' ? og_image.trim() : ''
  if (cleanImage && !isSafeUrl(cleanImage)) {
    return NextResponse.json(
      { error: 'og_image must be a valid http:// or https:// URL.' },
      { status: 400 },
    )
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('links')
    .insert({
      slug: cleanSlug,
      destination_url: cleanDest,
      og_title: typeof og_title === 'string' ? og_title.trim() || null : null,
      og_description: typeof og_description === 'string' ? og_description.trim() || null : null,
      og_image: cleanImage || null,
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
