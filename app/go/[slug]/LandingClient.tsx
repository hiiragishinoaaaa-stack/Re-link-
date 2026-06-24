'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import type { RedirectMethod } from '@/lib/supabase'

function buildAndroidIntent(url: string): string {
  try {
    const u = new URL(url)
    const hostPath = u.host + u.pathname + u.search + u.hash
    const fallback = encodeURIComponent(url)
    return `intent://${hostPath}#Intent;scheme=${u.protocol.replace(':', '')};package=com.zhiliaoapp.musically.lite;S.browser_fallback_url=${fallback};end`
  } catch {
    return url
  }
}

// TikTok Lite iOS URL scheme — bypasses the web cushion page when app is installed
function buildIOSTikTokScheme(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.endsWith('tiktok.com') || u.hostname.endsWith('tiktokv.com')) {
      return 'snssdk1180://' + u.host + u.pathname + u.search + u.hash
    }
    return null
  } catch {
    return null
  }
}

// Platform-aware redirect: Android → intent://, iOS → URL scheme w/ fallback, other → js_href
function smartRedirect(url: string) {
  const ua = navigator.userAgent
  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)

  if (isAndroid) {
    window.location.href = buildAndroidIntent(url)
    return
  }

  if (isIOS) {
    const schemeUrl = buildIOSTikTokScheme(url)
    if (schemeUrl) {
      window.location.href = schemeUrl
      // If the app didn't open (scheme unhandled), fall back to HTTPS after 1.5 s
      setTimeout(() => {
        if (!document.hidden) window.location.href = url
      }, 1500)
      return
    }
  }

  window.location.href = url
}

type Props = {
  title: string
  description: string
  image: string
  buttonText: string
  redirectMethod: RedirectMethod
  autoRedirectUrl: string
  action: () => Promise<string>
}

export default function LandingClient({
  title, description, image, buttonText,
  redirectMethod, autoRedirectUrl, action,
}: Props) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  // meta_refresh: navigate immediately on mount (click already counted server-side)
  useEffect(() => {
    if (redirectMethod === 'meta_refresh' && autoRedirectUrl) {
      window.location.replace(autoRedirectUrl)
    }
  }, [redirectMethod, autoRedirectUrl])

  async function handleClick() {
    if (redirectMethod === 'meta_refresh') {
      if (autoRedirectUrl) window.location.replace(autoRedirectUrl)
      return
    }

    setLoading(true)
    try {
      const url = await action()
      if (!url) return

      switch (redirectMethod) {
        case 'js_href':
          smartRedirect(url)
          break
        case 'normal_link': {
          const a = document.createElement('a')
          a.href = url
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          break
        }
        case 'android_intent':
          window.location.href = buildAndroidIntent(url)
          break
        case 'js_replace':
        default:
          window.location.replace(url)
          break
      }
    } catch {
      setLoading(false)
    }
  }

  const hasContent = title || description

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center">

        {image && (
          <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-sm bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: '320px' }}
            />
          </div>
        )}

        {hasContent && (
          <div className={`w-full text-center ${image ? '' : 'mb-2'}`}>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
                {title}
              </h1>
            )}
            {description && (
              <p className={`text-base text-gray-500 leading-relaxed ${title ? 'mt-3' : ''}`}>
                {description}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={loading}
          className={`
            w-full rounded-xl bg-indigo-600 px-6 py-4
            text-base font-semibold text-white
            hover:bg-indigo-700 active:bg-indigo-800
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors
            flex items-center justify-center gap-2
            ${hasContent || image ? 'mt-8' : ''}
          `}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t.buttonLoading}
            </>
          ) : (
            buttonText || t.buttonDefault
          )}
        </button>
      </div>
    </main>
  )
}
