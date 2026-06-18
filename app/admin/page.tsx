'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Link as LinkRow } from '@/lib/supabase'
import { useLanguage } from '@/lib/language-context'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const BASE_URL = 'https://re-link-ten.vercel.app'
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function AdminPage() {
  const { t } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [links, setLinks] = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const isAdmin = ADMIN_EMAIL && user?.email === ADMIN_EMAIL

  async function fetchLinks() {
    setFetchError('')
    try {
      const res = await fetch('/api/links')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        setFetchError(t.serverError + res.status)
        return
      }
      const data: LinkRow[] = await res.json()
      setLinks(data)
    } catch {
      setFetchError(t.failedToLoad)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) fetchLinks()
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    if (!confirm(t.deleteConfirm)) return
    setDeletingId(id)
    setDeleteError('')
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setDeleteError(t.deleteFailed + res.status)
        return
      }
      setLinks(prev => prev.filter(l => l.id !== id))
    } catch {
      setDeleteError(t.failedToDelete)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSignOut() {
    await getSupabaseBrowser().auth.signOut()
    router.push('/login')
  }

  const byClicks = [...links].sort((a, b) => b.click_count - a.click_count)
  const byDate = [...links].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0)
  const totalViews = links.reduce((sum, l) => sum + (l.view_count ?? 0), 0)
  const topSlug = byClicks[0]?.slug ?? null

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      {/* Language switcher — fixed top-left */}
      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{t.adminTitle}</h1>
              {isAdmin && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {t.adminBadge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{t.adminSubtitle}</p>
            {user && (
              <p className="text-xs text-gray-400 mt-0.5">
                {t.loggedInAs}<span className="font-mono">{user.email}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              {t.newLink}
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t.signOut}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label={t.totalLinks} value={links.length} />
          <StatCard label={t.totalViews} value={totalViews} />
          <StatCard label={t.totalClicks} value={totalClicks} />
          <StatCard label={t.topLink} value={topSlug ? `/${topSlug}` : '—'} mono />
        </div>

        {/* Error states */}
        {fetchError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-2">
            <span>{fetchError}</span>
            <button onClick={fetchLinks} className="underline shrink-0">{t.retry}</button>
          </div>
        )}
        {deleteError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {deleteError}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-400 py-16">{t.loading}</p>
        ) : links.length === 0 && !fetchError ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-400 mb-3">{t.noLinks}</p>
            <Link href="/" className="text-sm text-indigo-600 underline">
              {t.createFirstLink}
            </Link>
          </div>
        ) : links.length > 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{t.colShortLink}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">{t.colDestination}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{t.colOgTitle}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{t.colLanding}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{t.colMethod}</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">{t.colViews}</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">{t.colClicks}</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">{t.colCtr}</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">{t.colCreated}</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byDate.map(link => (
                    <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={`${BASE_URL}/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-indigo-600 hover:underline"
                        >
                          /{link.slug}
                        </a>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <a
                          href={link.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:underline truncate block"
                          title={link.destination_url}
                        >
                          {link.destination_url}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">
                        {link.og_title ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {link.landing_title ? (
                          <a
                            href={`${BASE_URL}/go/${link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                            title={link.landing_title}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            /go/{link.slug}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                          {link.redirect_method ?? 'js_replace'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                        {link.view_count ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {link.click_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                        {(link.view_count ?? 0) > 0
                          ? `${Math.round((link.click_count / (link.view_count ?? 1)) * 100)}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 whitespace-nowrap">
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(link.id)}
                          disabled={deletingId === link.id}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          {deletingId === link.id ? t.deleting : t.delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | number
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold truncate ${mono ? 'font-mono text-lg' : ''}`}>{value}</p>
    </div>
  )
}
