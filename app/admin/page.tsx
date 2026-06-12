'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Link as LinkRow } from '@/lib/supabase'

export default function AdminPage() {
  const [links, setLinks] = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  async function fetchLinks() {
    const res = await fetch('/api/links')
    const data = await res.json()
    setLinks(data)
    setLoading(false)
  }

  useEffect(() => { fetchLinks() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this link?')) return
    setDeletingId(id)
    await fetch(`/api/links/${id}`, { method: 'DELETE' })
    setLinks(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }

  const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0)

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your short links</p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            + New link
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total links" value={links.length} />
          <StatCard label="Total clicks" value={totalClicks} />
          <StatCard
            label="Top link"
            value={links.length ? `/${links.sort((a, b) => b.click_count - a.click_count)[0]?.slug}` : '—'}
            mono
          />
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading…</p>
        ) : links.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-400 mb-3">No links yet.</p>
            <Link href="/" className="text-sm text-indigo-600 underline">
              Create your first link →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Short link</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Destination</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">OG title</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Clicks</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Created</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {links
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(link => (
                      <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <a
                            href={`${baseUrl}/${link.slug}`}
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
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {link.click_count}
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
                            {deletingId === link.id ? '…' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
