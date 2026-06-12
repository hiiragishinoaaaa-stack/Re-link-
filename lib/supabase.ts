import { createClient } from '@supabase/supabase-js'

export type Link = {
  id: string
  slug: string
  destination_url: string
  og_title: string | null
  og_description: string | null
  og_image: string | null
  click_count: number
  created_at: string
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
