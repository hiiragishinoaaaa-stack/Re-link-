import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
  )
}

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
