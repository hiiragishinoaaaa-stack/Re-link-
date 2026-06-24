import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import LandingClient from './LandingClient'
import type { RedirectMethod } from '@/lib/supabase'

type Props = { params: Promise<{ slug: string }> }

function supabaseHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
}

async function fetchLink(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const res = await fetch(
    `${supabaseUrl}/rest/v1/links?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    { headers: supabaseHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return null
  const data = await res.json()
  return data[0] ?? null
}

function isTikTokUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname
    return h.endsWith('tiktok.com') || h.endsWith('tiktokv.com')
  } catch {
    return false
  }
}

async function rpc(fn: string, body: Record<string, unknown>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(body),
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const link = await fetchLink(slug)
  if (!link) return {}

  const title = link.og_title ?? link.landing_title ?? undefined
  const description = link.og_description ?? undefined
  const image = link.og_image ?? undefined

  const meta: Metadata = {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : [] },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : [],
    },
  }

  if (link.destination_url && isTikTokUrl(link.destination_url)) {
    meta.other = {
      'apple-itunes-app': `app-id=1491937174, app-argument=${link.destination_url}`,
    }
  }

  return meta
}

async function recordClick(id: string): Promise<void> {
  'use server'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  await fetch(`${supabaseUrl}/rest/v1/rpc/increment_click_count`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({ link_id: id }),
  })
}

async function resolveDestination(id: string): Promise<string> {
  'use server'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const headers = supabaseHeaders()
  await fetch(`${supabaseUrl}/rest/v1/rpc/increment_click_count`, {
    method: 'POST', headers, body: JSON.stringify({ link_id: id }),
  })
  const res = await fetch(
    `${supabaseUrl}/rest/v1/links?id=eq.${id}&select=destination_url&limit=1`,
    { headers },
  )
  const data = await res.json()
  return data[0]?.destination_url ?? ''
}

export default async function GoPage({ params }: Props) {
  const { slug } = await params
  const link = await fetchLink(slug)
  if (!link) notFound()

  const method: RedirectMethod = link.redirect_method ?? 'js_replace'

  await rpc('increment_view_count', { link_id: link.id })

  if (method === 'redirect_302') {
    await rpc('increment_click_count', { link_id: link.id })
    redirect(link.destination_url)
  }

  let autoRedirectUrl = ''
  if (method === 'meta_refresh') {
    await rpc('increment_click_count', { link_id: link.id })
    autoRedirectUrl = link.destination_url
  }

  const action = resolveDestination.bind(null, link.id)
  const trackClick = recordClick.bind(null, link.id)

  return (
    <LandingClient
      title={link.landing_title ?? ''}
      description={link.landing_description ?? ''}
      image={link.landing_image ?? ''}
      buttonText={link.button_text ?? 'Continue'}
      redirectMethod={method}
      autoRedirectUrl={autoRedirectUrl}
      destinationUrl={link.destination_url ?? ''}
      action={action}
      trackClick={trackClick}
    />
  )
}
