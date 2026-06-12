'use client'

import { useState } from 'react'
import Link from 'next/link'

type CreatedLink = {
  slug: string
  destination_url: string
}

export default function HomePage() {
  const [form, setForm] = useState({
    slug: '',
    destination_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
  })
  const [created, setCreated] = useState<CreatedLink | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setCopied(false)

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }

      setCreated(data)
      setForm({ slug: '', destination_url: '', og_title: '', og_description: '', og_image: '' })
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(`${baseUrl}/${created.slug}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (non-HTTPS, Firefox without permission, etc.)
      // Silently ignore — the URL is visible in the code element for manual copy
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Re:link</h1>
          <p className="mt-1 text-gray-500 text-sm">Short links with custom OG previews</p>
        </div>

        {/* Success banner */}
        {created && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800 mb-2">Link created!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white border border-green-200 px-3 py-2 text-sm text-green-900 truncate min-w-0">
                {baseUrl}/{created.slug}
              </code>
              <button
                onClick={copyLink}
                className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors min-w-[60px]"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short slug <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
              <span className="bg-gray-50 border-r border-gray-300 px-3 py-2 text-sm text-gray-500 select-none whitespace-nowrap">
                {baseUrl}/
              </span>
              <input
                type="text"
                required
                placeholder="my-link"
                value={form.slug}
                onChange={e =>
                  setForm(f => ({ ...f, slug: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') }))
                }
                className="flex-1 min-w-0 px-3 py-2 text-sm outline-none bg-white"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Letters, numbers, hyphens and underscores only.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/very/long/url"
              value={form.destination_url}
              onChange={e => setForm(f => ({ ...f, destination_url: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <hr className="border-gray-100" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            OG Preview (optional)
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
            <input
              type="text"
              placeholder="My awesome page"
              value={form.og_title}
              onChange={e => setForm(f => ({ ...f, og_title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
            <textarea
              placeholder="A short description shown in link previews"
              value={form.og_description}
              onChange={e => setForm(f => ({ ...f, og_description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
            <input
              type="url"
              placeholder="https://example.com/og-image.jpg"
              value={form.og_image}
              onChange={e => setForm(f => ({ ...f, og_image: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
            {loading ? 'Creating…' : 'Create short link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          <Link href="/admin" className="underline hover:text-gray-600">
            View admin dashboard →
          </Link>
        </p>
      </div>
    </main>
  )
}
