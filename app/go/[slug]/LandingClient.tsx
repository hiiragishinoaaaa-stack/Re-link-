'use client'

import { useState } from 'react'

type Props = {
  title: string
  description: string
  image: string
  buttonText: string
  // Server action: increments click count server-side and returns destination URL.
  // The destination is never embedded in the page HTML — it only comes back at click time.
  action: () => Promise<string>
}

export default function LandingClient({ title, description, image, buttonText, action }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const url = await action()
      if (url) window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  const hasContent = title || description

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center">

        {/* Image */}
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

        {/* Text content */}
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

        {/* CTA button */}
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
              Loading…
            </>
          ) : (
            buttonText || 'Continue'
          )}
        </button>
      </div>
    </main>
  )
}
