'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { useLanguage } from '@/lib/language-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function LoginPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getSupabaseBrowser()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(t.invalidCredentials)
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
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
          <p className="mt-1 text-gray-500 text-sm">{t.signIn}</p>
        </div>

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
            {loading ? t.signingIn : t.signIn}
          </button>

          <div className="pt-1 space-y-1 text-center">
            <p>
              <Link href="/auth/reset" className="text-sm text-gray-400 underline hover:text-gray-600">
                {t.forgotPassword}
              </Link>
            </p>
            <p>
              <Link href="/signup" className="text-sm text-gray-400 underline hover:text-gray-600">
                {t.noAccount}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
