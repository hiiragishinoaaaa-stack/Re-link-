import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const RESERVED_SLUGS = new Set([
  'favicon.ico', 'robots.txt', 'sitemap.xml', 'manifest.json',
  '_next', 'api', 'admin', 'login', 'signup', 'auth', 'go',
])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Reject non-ASCII slugs and reserved paths before any header construction.
  // Vercel passes nxtPslug containing the raw URL segment (possibly Japanese)
  // and Next.js would embed it in x-next-cache-tags, triggering a ByteString error.
  if (!/^[a-zA-Z0-9_-]+$/.test(slug) || RESERVED_SLUGS.has(slug)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const supabase = getSupabaseAdmin()

  const { data: link, error } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !link) {
    return new NextResponse('Link not found', { status: 404 })
  }

  // Atomic DB-level increment — avoids read-modify-write race and
  // runs with await so serverless functions don't drop it before completion.
  await supabase.rpc('increment_click_count', { link_id: link.id })

  const dest = link.destination_url

  // Guard: only redirect to http/https URLs. A javascript: destination would
  // execute as XSS via window.location.replace even though the value is
  // JSON-stringified — JSON.stringify doesn't defuse javascript: payloads.
  if (!isSafeUrl(dest)) {
    return new NextResponse('Invalid destination URL', { status: 400 })
  }

  const title = link.og_title ?? dest
  const description = link.og_description ?? ''
  const image = link.og_image ?? ''

  // Return HTML with OG meta tags + instant JS redirect.
  // OG scrapers (Slack, Twitter, iMessage, etc.) read meta tags before
  // executing JS, so they see the custom preview. Real users get the redirect.
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
      // Prevent caching so click counts are always fresh
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
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#x27;')
}
