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

function isTikTokDest(url: string): boolean {
  try { return new URL(url).hostname.endsWith('tiktok.com') || new URL(url).hostname.endsWith('tiktokv.com') } catch { return false }
}

type Props = {
  title: string
  description: string
  image: string
  buttonText: string
  redirectMethod: RedirectMethod
  autoRedirectUrl: string
  destinationUrl: string
  action: () => Promise<string>
  trackClick: () => Promise<void>
}

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
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    if (redirectMethod === 'meta_refresh' && autoRedirectUrl) {
      window.location.replace(autoRedirectUrl)
    }
  }, [redirectMethod, autoRedirectUrl])

  // iOS Safari cannot trigger Universal Links via ANY JavaScript navigation
  // (window.location.href, <a>.click(), window.open — all blocked by iOS 13+).
  // The ONLY reliable method from within Safari is the Smart App Banner "開く"
  // button, which iOS processes outside the browser's navigation sandbox.
  // We render a prominent hint pointing users to that banner.
  const showIOSBannerHint = isIOS && redirectMethod === 'js_href' && isTikTokDest(destinationUrl)

  function handleNativeClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (/Android/i.test(navigator.userAgent)) {
      e.preventDefault()
      trackClick().catch(() => {})
      window.location.href = buildAndroidIntent(destinationUrl)
      return
    }
    trackClick().catch(() => {})
  }

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

        {/* iOS Smart App Banner hint — shown above content so users look up */}
        {showIOSBannerHint && (
          <div className="w-full mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3.5 text-center">
            <p className="text-sm font-bold text-indigo-700">
              ↑ 上の「開く」をタップ
            </p>
            <p className="text-xs text-indigo-500 mt-0.5 leading-relaxed">
              Safari 上部のバナーから TikTok Lite が1タップで起動します
            </p>
          </div>
        )}

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
          <a
            href={destinationUrl}
            onClick={handleNativeClick}
            className={`
              w-full rounded-xl px-6 py-4
              text-base font-semibold text-center
              transition-colors flex items-center justify-center gap-2
              ${showIOSBannerHint
                // iOS TikTok: secondary style — main action is the Smart App Banner
                ? 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                // Android / other: primary style
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
              }
              ${marginTop}
            `}
          >
            {showIOSBannerHint ? 'ブラウザで開く' : (buttonText || t.buttonDefault)}
          </a>
        ) : (
          <button
            onClick={handleClick}
            disabled={loading}
            className={`w-full rounded-xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${marginTop}`}
          >
            {loading ? <><Spinner />{t.buttonLoading}</> : (buttonText || t.buttonDefault)}
          </button>
        )}
      </div>
    </main>
  )
}
