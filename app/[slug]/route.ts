import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data: link, error } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !link) {
    return new NextResponse('Link not found', { status: 404 })
  }

  // Increment click count (fire-and-forget, don't block the redirect)
  supabase
    .from('links')
    .update({ click_count: link.click_count + 1 })
    .eq('id', link.id)
    .then(() => {})

  const title = link.og_title ?? link.destination_url
  const description = link.og_description ?? ''
  const image = link.og_image ?? ''
  const dest = link.destination_url

  // Return HTML with OG meta tags + instant JS redirect.
  // OG scrapers (Slack, Twitter, etc.) read the meta tags before executing JS.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(dest)}" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  ${description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : ''}
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
  <meta property="og:url" content="${escapeHtml(dest)}" />
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  ${description ? `<meta name="twitter:description" content="${escapeHtml(description)}" />` : ''}
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
  <script>window.location.replace(${JSON.stringify(dest)});</script>
</head>
<body></body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
