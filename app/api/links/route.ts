import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  await req.json()
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized.' }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('links')
    .insert({
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
    })
    .select('slug')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ slug: data.slug }, { status: 201 })
}
