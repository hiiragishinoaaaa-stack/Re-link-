import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import LandingClient from './LandingClient'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data } = await getSupabaseAdmin()
    .from('links')
    .select('og_title, og_description, og_image, landing_title')
    .eq('slug', slug)
    .single()

  if (!data) return {}

  // OG fields take precedence; fall back to landing_title for the page <title>
  const title = data.og_title ?? data.landing_title ?? undefined
  const description = data.og_description ?? undefined
  const image = data.og_image ?? undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

// Server action: called by the client on button click.
// Increments click count atomically, then returns the destination URL.
// The destination is resolved at click time — it is never embedded in the page HTML.
async function resolveDestination(id: string): Promise<string> {
  'use server'
  const supabase = getSupabaseAdmin()
  await supabase.rpc('increment_click_count', { link_id: id })
  const { data } = await supabase
    .from('links')
    .select('destination_url')
    .eq('id', id)
    .single()
  return data?.destination_url ?? ''
}

export default async function GoPage({ params }: Props) {
  const { slug } = await params
  const { data: link } = await getSupabaseAdmin()
    .from('links')
    .select('id, landing_title, landing_description, landing_image, button_text')
    .eq('slug', slug)
    .single()

  if (!link) notFound()

  // Bind the link id into the server action so the client receives a zero-argument function.
  const action = resolveDestination.bind(null, link.id)

  return (
    <LandingClient
      title={link.landing_title ?? ''}
      description={link.landing_description ?? ''}
      image={link.landing_image ?? ''}
      buttonText={link.button_text ?? 'Continue'}
      action={action}
    />
  )
}
