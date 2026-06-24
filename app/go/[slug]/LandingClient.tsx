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

type Props = {
  title: string
  description: string
  image: string
  buttonText: string
  redirectMethod: RedirectMethod
  autoRedirectUrl: string
  // Pre-loaded destination URL — used by js_href to render a real <a> tag so
  // iOS Safari treats the tap as a user-gesture link click, which triggers
  // Universal Links and opens TikTok Lite directly without a web cushion.
  destinationUrl: string
  action: () => Promise<string>
  trackClick: () => Promise<void>
}

const BTN_CLS = `
  w-full rounded-xl bg-indigo-600 px-6 py-4
  text-base font-semibold text-white text-center
  hover:bg-indigo-700 active:bg-indigo-800
  disabled:opacity-60 disabled:cursor-not-allowed
  transition-colors flex items-center justify-center gap-2
`

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function LandingClient({
  title, description, image, buttonText,
  redirectMethod, autoRedirectUrl, destinationUrl,
  action, trackClick,
}: Props) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  // meta_refresh: navigate immediately on mount (click already counted server-side)
  useEffect(() => {
    if (redirectMethod === 'meta_refresh' && autoRedirectUrl) {
      window.location.replace(autoRedirectUrl)
    }
  }, [redirectMethod, autoRedirectUrl])

  // ── js_href: render a real <a> tag so the user's finger tap is treated as
  //    a native link gesture by iOS Safari.  This is what triggers Universal
  //    Links and opens TikTok Lite directly (vs window.location.href which iOS
  //    treats as programmatic JS navigation and does NOT trigger UL).
  //    Android intercepts the click to inject intent:// instead.
  function handleNativeClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (isAndroid) {
      e.preventDefault()
      trackClick().catch(() => {})
      window.location.href = buildAndroidIntent(destinationUrl)
      return
    }
    // iOS / Desktop: fire tracking async, let native navigation proceed
    trackClick().catch(() => {})
    // no preventDefault — browser handles href, Universal Links can fire
  }

  // ── Other redirect methods: async button → server action returns URL
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
  const marginTop = hasContent || image ? 'mt-8' : ''

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center">

        {image && (
          <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-sm bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="w-full object-cover" style={{ maxHeight: '320px' }} />
          </div>
        )}

        {hasContent && (
          <div className={`w-full text-center ${image ? '' : 'mb-2'}`}>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{title}</h1>
            )}
            {description && (
              <p className={`text-base text-gray-500 leading-relaxed ${title ? 'mt-3' : ''}`}>{description}</p>
            )}
          </div>
        )}

        {redirectMethod === 'js_href' && destinationUrl ? (
          // Native <a> tag — iOS Safari recognises a direct finger-tap on an anchor
          // as a user-gesture link click, which is required to trigger Universal Links.
          <a
            href={destinationUrl}
            onClick={handleNativeClick}
            className={`${BTN_CLS} ${marginTop}`}
          >
            {buttonText || t.buttonDefault}
          </a>
        ) : (
          <button
            onClick={handleClick}
            disabled={loading}
            className={`${BTN_CLS} ${marginTop}`}
          >
            {loading ? <><Spinner />{t.buttonLoading}</> : (buttonText || t.buttonDefault)}
          </button>
        )}
      </div>
    </main>
  )
}
