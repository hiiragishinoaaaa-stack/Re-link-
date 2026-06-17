import { Page } from '../App'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems: { page: Page; label: string; icon: string }[] = [
  { page: 'accounts',    label: 'アカウント一覧',  icon: '👥' },
  { page: 'register',   label: 'アカウント登録',  icon: '➕' },
  { page: 'schedule',   label: '投稿予約',        icon: '📅' },
  { page: 'history',    label: '投稿履歴',        icon: '📋' },
  { page: 'ai-generate',label: 'AI投稿文生成',    icon: '🤖' },
  { page: 'analytics',  label: '分析',            icon: '📊' },
  { page: 'logs',       label: 'ログ',            icon: '📝' },
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-60 bg-gray-900 min-h-screen flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">𝕏</span>
          <div>
            <h1 className="text-white font-bold text-sm">運用管理ダッシュボード</h1>
            <p className="text-gray-400 text-xs">X Ops Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentPage === item.page
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-700">
        <span className="text-gray-600 text-xs">MVP v1.0 · mock mode</span>
      </div>
    </aside>
  )
}
