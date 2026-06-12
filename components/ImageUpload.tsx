'use client'

import { useRef, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

const BUCKET = 'link-images'
const MAX_BYTES = 5 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

type Props = {
  value: string
  onChange: (url: string) => void
  placeholder?: string
}

export default function ImageUpload({ value, onChange, placeholder }: Props) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFile(file: File) {
    setUploadError('')

    const ext = MIME_TO_EXT[file.type]
    if (!ext) {
      setUploadError(t.uploadError)
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError(t.uploadHint)
      return
    }

    setUploading(true)
    try {
      // Path is a pure-ASCII UUID — file.name is never read or used anywhere.
      // The Supabase SDK uploads the file as a binary body (not multipart),
      // so there is no Content-Disposition header and no ByteString risk.
      const path = `${crypto.randomUUID()}.${ext}`
      const supabase = getSupabaseBrowser()

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type })

      if (error) {
        setUploadError(error.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      onChange(publicUrl)
    } catch {
      setUploadError(t.uploadError)
    } finally {
      setUploading(false)
    }
  }

  const inputCls =
    'flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={e => { setUploadError(''); onChange(e.target.value) }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t.uploading}
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t.uploadImage}
            </>
          )}
        </button>
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {uploadError && (
        <p className="mt-1 text-xs text-red-600">{uploadError}</p>
      )}

      {value && !uploadError && (
        <div className="mt-2 relative inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-20 rounded-lg object-cover border border-gray-200 bg-gray-100"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 text-white text-xs leading-none hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            ×
          </button>
        </div>
      )}

      <p className="mt-1 text-xs text-gray-400">{t.uploadHint}</p>
    </div>
  )
}
