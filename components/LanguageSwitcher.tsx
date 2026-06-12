'use client'

import { useLanguage } from '@/lib/language-context'
import type { Lang } from '@/lib/i18n'

const OPTIONS: { value: Lang; flag: string; label: string }[] = [
  { value: 'ja', flag: '🇯🇵', label: '日本語' },
  { value: 'en', flag: '🇺🇸', label: 'English' },
]

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setLang(opt.value)}
          aria-pressed={lang === opt.value}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors min-w-[80px] justify-center ${
            lang === opt.value
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          <span role="img" aria-label={opt.label}>{opt.flag}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
