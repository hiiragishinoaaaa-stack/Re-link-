'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import ImageUpload from '@/components/ImageUpload'
import type { Link as LinkRow } from '@/lib/supabase'

const BASE_URL = 'https://re-link-ten.vercel.app'

const REDIRECT_METHODS = [
  { value: 'normal_link', label: '通常リンク' },
  { value: 'js_href',     label: 'TikTok用リンク' },
] as const

function CopyRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 truncate min-w-0">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors min-w-[72px]"
        >
          {copied ? 'コピー済み！' : 'コピー'}
        </button>
      </div>
    </div>
  )
}

export default function LinkDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { t } = useLanguage()

  const [link, setLink] = useState<LinkRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    destination_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
    landing_title: '',
    landing_description: '',
    landing_image: '',
    button_text: '',
    redirect_method: 'js_href',
  })

  const fetchLink = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/links/${id}`)
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) { setError('リンクの読み込みに失敗しました。'); return }
      const data: LinkRow = await res.json()
      setLink(data)
      setForm({
        destination_url: data.destination_url ?? '',
        og_title: data.og_title ?? '',
        og_description: data.og_description ?? '',
        og_image: data.og_image ?? '',
        landing_title: data.landing_title ?? '',
        landing_description: data.landing_description ?? '',
        landing_image: data.landing_image ?? '',
        button_text: data.button_text ?? '',
        redirect_method: data.redirect_method ?? 'js_href',
      })
    } catch {
      setError('読み込みエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchLink() }, [fetchLink])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '保存に失敗しました。'); return }
      setLink(prev => prev ? { ...prev, ...data } : data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('保存エラーが発生しました。')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">{t.loading}</p>
      </main>
    )
  }

  if (!link) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">{error || 'リンクが見つかりません。'}</p>
          <Link href="/admin" className="text-indigo-600 underline text-sm">管理ダッシュボードに戻る</Link>
        </div>
      </main>
    )
  }

  const directUrl = `${BASE_URL}/${link.slug}`
  const landingUrl = `${BASE_URL}/go/${link.slug}`

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg">

        {/* Back */}
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
          ← 管理ダッシュボードに戻る
        </Link>

        {/* Slug header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">/{link.slug}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(link.created_at).toLocaleDateString()} 作成　•
            表示 {link.view_count ?? 0}　•　クリック {link.click_count}
          </p>
        </div>

        {/* Copy both URLs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">リンクをコピー</p>
          <CopyRow label="直接リダイレクト" url={directUrl} />
          <CopyRow label="ランディングページ" url={landingUrl} />
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">編集</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">リンク先URL <span className="text-red-500">*</span></label>
            <input
              type="url"
              required
              value={form.destination_url}
              onChange={e => setForm(f => ({ ...f, destination_url: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">遷移方式</label>
            <select
              value={form.redirect_method}
              onChange={e => setForm(f => ({ ...f, redirect_method: e.target.value }))}
              className={inputCls}
            >
              {REDIRECT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <hr className="border-gray-100" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">OGプレビュー</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OGタイトル</label>
            <input type="text" value={form.og_title} onChange={e => setForm(f => ({ ...f, og_title: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OG説明文</label>
            <textarea value={form.og_description} onChange={e => setForm(f => ({ ...f, og_description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OG画像</label>
            <ImageUpload
              value={form.og_image}
              onChange={url => setForm(f => ({ ...f, og_image: url }))}
              placeholder="https://example.com/og-image.jpg"
            />
          </div>

          <hr className="border-gray-100" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">ランディングページ</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
            <input type="text" value={form.landing_title} onChange={e => setForm(f => ({ ...f, landing_title: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明文</label>
            <textarea value={form.landing_description} onChange={e => setForm(f => ({ ...f, landing_description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">画像</label>
            <ImageUpload
              value={form.landing_image}
              onChange={url => setForm(f => ({ ...f, landing_image: url }))}
              placeholder="https://example.com/banner.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ボタンのテキスト</label>
            <input type="text" value={form.button_text} onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))} className={inputCls} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">保存しました！</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中…' : '保存する'}
            </button>
            <Link
              href="/admin"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
