import { createClient } from '@supabase/supabase-js'

export type Link = {
  id: string
  slug: string
  destination_url: string
  og_title: string | null
  og_description: string | null
  og_image: string | null
  landing_title: string | null
  landing_description: string | null
  landing_image: string | null
  button_text: string | null
  click_count: number
  created_at: string
}

// Create a new client per request (standard pattern for Next.js server-side code).
// Module-level createClient() throws during `next build` when env vars aren't
// present, because Turbopack evaluates server modules at build time.
// Env vars are always available at request time (Vercel injects them; locally use .env.local).
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
