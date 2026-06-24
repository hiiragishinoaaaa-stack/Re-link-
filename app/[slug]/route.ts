import { NextRequest, NextResponse } from 'next/server'

const RESERVED_SLUGS = new Set([
  'favicon.ico', 'robots.txt', 'sitemap.xml', 'manifest.json',
  '_next', 'api', 'admin', 'login', 'signup', 'auth', 'go',
])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!/^[a-zA-Z0-9_-]+$/.test(slug) || RESERVED_SLUGS.has(slug)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(
    `${supabaseUrl}/rest/v1/links?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }, cache: 'no-store' },
  )

  if (!res.ok) return new NextResponse('Not Found', { status: 404 })
  const data = await res.json()
  const link = data[0]
  if (!link) return new NextResponse('Not Found', { status: 404 })

  const dest: string = link.destination_url ?? ''
  if (!isSafeUrl(dest)) return new NextResponse('Not Found', { status: 404 })

  // increment click count (fire-and-forget is fine here)
  fetch(`${supabaseUrl}/rest/v1/rpc/increment_click_count`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ link_id: link.id }),
  }).catch(() => {})

  const title = link.og_title ?? dest
  const description = link.og_description ?? ''
  const image = link.og_image ?? ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=${escapeAttr(dest)}" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeAttr(title)}" />
  ${description ? `<meta property="og:description" content="${escapeAttr(description)}" />` : ''}
  ${image ? `<meta property="og:image" content="${escapeAttr(image)}" />` : ''}
  <meta property="og:url" content="${escapeAttr(dest)}" />
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${escapeAttr(title)}" />
  ${description ? `<meta name="twitter:description" content="${escapeAttr(description)}" />` : ''}
  ${image ? `<meta name="twitter:image" content="${escapeAttr(image)}" />` : ''}
  <script>window.location.replace(${JSON.stringify(dest)});</script>
</head>
<body></body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(str: string) {
  return str
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#x27;')
}
