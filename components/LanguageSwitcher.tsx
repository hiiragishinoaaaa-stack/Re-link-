'use client'

import { useLanguage } from '@/lib/language-context'
import type { Lang } from '@/lib/i18n'

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'ja', label: 'JA' },
  { value: 'en', label: 'EN' },
]

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setLang(opt.value)}
          aria-pressed={lang === opt.value}
          className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
            lang === opt.value
              ? 'bg-indigo-600 text-white'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
