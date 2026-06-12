import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/language-context'

export const metadata: Metadata = {
  title: 'Re:link — Simple URL Shortener',
  description: 'Create short links with custom OG tags.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
