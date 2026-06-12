import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const isAdmin = ADMIN_EMAIL && user.email === ADMIN_EMAIL
  const db = isAdmin ? getSupabaseAdmin() : supabase

  // Admin can delete any link; regular users can only delete their own.
  const query = isAdmin
    ? db.from('links').delete().eq('id', id)
    : db.from('links').delete().eq('id', id).eq('user_id', user.id)

  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
