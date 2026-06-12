import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const BUCKET = 'link-images'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

// MIME type → safe ASCII extension. Extension is derived from the MIME type,
// never from file.name, so Japanese/emoji filenames can't reach storage headers.
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  const ext = MIME_TO_EXT[file.type]
  if (!ext) {
    return NextResponse.json(
      { error: 'Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed.' },
      { status: 400 },
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File size must be under 5 MB.' }, { status: 400 })
  }

  // Use UUID + MIME-derived extension. Never use file.name — it may contain
  // non-ASCII characters that cause a ByteString error in HTTP headers.
  const filename = `${crypto.randomUUID()}.${ext}`
  const buffer = await file.arrayBuffer()

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl }, { status: 201 })
}
