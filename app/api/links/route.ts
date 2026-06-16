import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  return Response.json([])
}

function assertAsciiHeaders(headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    const s = String(value)
    for (let i = 0; i < s.length; i++) {
      if (s.charCodeAt(i) > 255) {
        throw new Error(
          `BAD_HEADER key=${key} index=${i} char=${s[i]} code=${s.charCodeAt(i)} value=${s}`
        )
      }
    }
  }
}

export async function POST(req: NextRequest) {
  let stage = 'start'
  try {
    stage = 'req.json'
    await req.json()

    stage = 'auth'
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized.' }, { status: 401 })

    stage = 'insert'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const insertHeaders: Record<string, string> = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    }

    stage = 'assert_headers'
    assertAsciiHeaders(insertHeaders)

    stage = 'fetch'
    const keyPreview = serviceKey ? serviceKey.slice(0, 15) : '(undefined)'
    const urlPreview = supabaseUrl ? supabaseUrl.slice(0, 40) : '(undefined)'
    const res = await fetch(`${supabaseUrl}/rest/v1/links`, {
      method: 'POST',
      headers: insertHeaders,
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
      return new Response(
        `POST_ERROR\nstage=fetch_response\nstatus=${res.status}\nkey_prefix=${keyPreview}\nurl_prefix=${urlPreview}\nmessage=${text}`,
        { status: res.status, headers: { 'content-type': 'text/plain; charset=utf-8' } },
      )
    }

    stage = 'response'
    const inserted = await res.json()
    return Response.json({ slug: inserted[0].slug }, { status: 201 })

  } catch (error) {
    const err = error as Error
    return new Response(
      `POST_ERROR\nstage=${stage}\nmessage=${String(err?.message)}\nstack=${String(err?.stack)}`,
      { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    )
  }
}
