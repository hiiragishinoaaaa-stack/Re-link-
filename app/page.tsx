'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ImageUpload from '@/components/ImageUpload'

type CreatedLink = {
  slug: string
  landing_title: string | null
}

const EMPTY_FORM = {
  slug: '',
  destination_url: '',
  og_title: '',
  og_description: '',
  og_image: '',
  landing_title: '',
  landing_description: '',
  landing_image: '',
  button_text: '',
}

const BASE_URL = 'https://re-link-ten.vercel.app'

export default function HomePage() {
  const { t } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [created, setCreated] = useState<CreatedLink | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedDirect, setCopiedDirect] = useState(false)
  const [copiedLanding, setCopiedLanding] = useState(false)

  function set(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setCopiedDirect(false)
    setCopiedLanding(false)

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t.somethingWrong)
        return
      }
      setCreated({ slug: data.slug, landing_title: data.landing_title ?? null })
      setForm(EMPTY_FORM)
    } catch {
      setError(t.networkError)
    } finally {
      setLoading(false)
    }
  }

  async function copy(text: string, setCopied: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — URL remains visible for manual copy
    }
  }

  const directUrl = created ? `${BASE_URL}/${created.slug}` : ''
  const landingUrl = created ? `${BASE_URL}/go/${created.slug}` : ''
  const hasLanding = !!created?.landing_title

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Language switcher — fixed top-left */}
      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Re:link</h1>
          <p className="mt-1 text-gray-500 text-sm">{t.tagline}</p>
        </div>

        {/* Success banner */}
        {created && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
            <p className="text-sm font-medium text-green-800">{t.linkCreated}</p>

            <UrlRow
              label={t.directRedirect}
              url={directUrl}
              copied={copiedDirect}
              copyLabel={t.copy}
              copiedLabel={t.copied}
              onCopy={() => copy(directUrl, setCopiedDirect)}
            />

            {hasLanding && (
              <UrlRow
                label={t.landingPageUrl}
                url={landingUrl}
                copied={copiedLanding}
                copyLabel={t.copy}
                copiedLabel={t.copied}
                onCopy={() => copy(landingUrl, setCopiedLanding)}
              />
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.shortSlug} <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
              <span className="bg-gray-50 border-r border-gray-300 px-3 py-2 text-sm text-gray-500 select-none whitespace-nowrap">
                {BASE_URL}/
              </span>
              <input
                type="text"
                required
                placeholder={t.slugPlaceholder}
                value={form.slug}
                onChange={e =>
                  setForm(f => ({ ...f, slug: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') }))
                }
                className="flex-1 min-w-0 px-3 py-2 text-sm outline-none bg-white"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">{t.slugHint}</p>
          </div>

          {/* Destination URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.destinationUrl} <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder={t.destinationPlaceholder}
              value={form.destination_url}
              onChange={set('destination_url')}
              className={inputCls}
            />
          </div>

          {/* OG section */}
          <hr className="border-gray-100" />
          <SectionLabel>{t.ogSection}</SectionLabel>
          <p className="text-xs text-gray-400 -mt-2">{t.ogHint}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.ogTitle}</label>
            <input type="text" placeholder={t.ogTitlePlaceholder} value={form.og_title} onChange={set('og_title')} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.ogDescription}</label>
            <textarea placeholder={t.ogDescriptionPlaceholder} value={form.og_description} onChange={set('og_description')} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.ogImageUrl}</label>
            <ImageUpload
              value={form.og_image}
              onChange={url => setForm(f => ({ ...f, og_image: url }))}
              placeholder="https://example.com/og-image.jpg"
            />
          </div>

          {/* Landing page section */}
          <hr className="border-gray-100" />
          <SectionLabel>{t.landingSection}</SectionLabel>
          <p className="text-xs text-gray-400 -mt-2">
            {t.landingHintBefore}
            <span className="font-mono">/go/{form.slug || 'slug'}</span>
            {t.landingHintAfter}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.landingTitle}</label>
            <input type="text" placeholder={t.landingTitlePlaceholder} value={form.landing_title} onChange={set('landing_title')} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.landingDesc}</label>
            <textarea placeholder={t.landingDescPlaceholder} value={form.landing_description} onChange={set('landing_description')} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.landingImageUrl}</label>
            <ImageUpload
              value={form.landing_image}
              onChange={url => setForm(f => ({ ...f, landing_image: url }))}
              placeholder="https://example.com/banner.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.buttonText}</label>
            <input type="text" placeholder={t.buttonTextPlaceholder} value={form.button_text} onChange={set('button_text')} className={inputCls} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t.creating : t.createLink}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          <Link href="/admin" className="underline hover:text-gray-600">
            {t.adminLink}
          </Link>
        </p>
      </div>
    </main>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</p>
  )
}

function UrlRow({
  label,
  url,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: {
  label: string
  url: string
  copied: boolean
  copyLabel: string
  copiedLabel: string
  onCopy: () => void
}) {
  return (
    <div>
      <p className="text-xs text-green-700 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-white border border-green-200 px-3 py-2 text-sm text-green-900 truncate min-w-0">
          {url}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors min-w-[60px]"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  )
}
