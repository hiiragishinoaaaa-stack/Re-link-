import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, destination_url, og_title, og_description, og_image } = body

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }
  if (!destination_url || typeof destination_url !== 'string') {
    return NextResponse.json({ error: 'destination_url is required' }, { status: 400 })
  }

  const cleanSlug = slug.trim().toLowerCase()
  if (!/^[a-zA-Z0-9-_]+$/.test(cleanSlug)) {
    return NextResponse.json(
      { error: 'Slug may only contain letters, numbers, hyphens, and underscores.' },
      { status: 400 }
    )
  }

  // Reserved slugs
  if (['admin', 'api'].includes(cleanSlug)) {
    return NextResponse.json({ error: 'That slug is reserved.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('links')
    .insert({
      slug: cleanSlug,
      destination_url: destination_url.trim(),
      og_title: og_title?.trim() || null,
      og_description: og_description?.trim() || null,
      og_image: og_image?.trim() || null,
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
