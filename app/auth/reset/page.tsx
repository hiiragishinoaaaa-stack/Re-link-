'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { useLanguage } from '@/lib/language-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const SITE_URL = 'https://re-link-ten.vercel.app'

export default function ResetPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getSupabaseBrowser()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/auth/callback?next=/auth/update-password`,
    })

    if (authError) {
      setError(authError.message || t.authError)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Re:link</h1>
          <p className="mt-1 text-gray-500 text-sm">{t.forgotPassword}</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-4">
            <p className="text-sm text-green-800">{t.resetEmailSent}</p>
            <Link href="/login" className="text-sm text-indigo-600 underline">
              {t.backToLogin}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
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
              {loading ? t.sendingEmail : t.sendResetEmail}
            </button>

            <p className="text-center">
              <Link href="/login" className="text-sm text-gray-400 underline hover:text-gray-600">
                {t.backToLogin}
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
