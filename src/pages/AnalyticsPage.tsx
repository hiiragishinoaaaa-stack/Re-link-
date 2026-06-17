import { useEffect, useState } from 'react'

interface Summary {
  accounts: number
  posts: { total: number; posted: number; scheduled: number; draft: number; failed: number }
  engagement: { totalImpressions: number; totalLikes: number; totalRetweets: number; totalReplies: number }
}

interface DailyPost { date: string; count: number; status: string }

interface Account { id: string; username: string; display_name: string }

interface AccountStats {
  account: Account
  postStats: { status: string; count: number }[]
  recentPosts: { id: string; content: string; status: string; posted_at: string | null; created_at: string }[]
  metrics: { date: string; impressions: number; likes: number; retweets: number }[]
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [dailyPosts, setDailyPosts] = useState<DailyPost[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [accountStats, setAccountStats] = useState<AccountStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSummary = async () => {
    setLoading(true)
    const [summaryRes, dailyRes, accRes] = await Promise.all([
      fetch('/api/analytics/summary'),
      fetch('/api/analytics/posts-by-day'),
      fetch('/api/accounts'),
    ])
    setSummary(await summaryRes.json())
    setDailyPosts(await dailyRes.json())
    const accs = await accRes.json()
    setAccounts(accs)
    setLoading(false)
  }

  const loadAccountStats = async (id: string) => {
    const res = await fetch(`/api/analytics/account/${id}`)
    if (res.ok) setAccountStats(await res.json())
  }

  useEffect(() => { loadSummary() }, [])

  useEffect(() => {
    if (selectedAccount) loadAccountStats(selectedAccount)
    else setAccountStats(null)
  }, [selectedAccount])

  const maxDaily = Math.max(...dailyPosts.map(d => d.count), 1)

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">分析</h2>
        <p className="text-gray-500 text-sm mt-0.5">投稿パフォーマンスとエンゲージメント (※ mock データを含む)</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="アカウント数" value={summary.accounts} color="text-indigo-600" />
            <MetricCard label="総投稿数" value={summary.posts.total} sub={`投稿済: ${summary.posts.posted}`} color="text-blue-600" />
            <MetricCard label="予約中" value={summary.posts.scheduled} color="text-amber-600" />
            <MetricCard label="失敗" value={summary.posts.failed} color="text-red-600" />
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">エンゲージメント (mock)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="インプレッション" value={summary.engagement.totalImpressions.toLocaleString()} color="text-gray-800" />
              <MetricCard label="いいね" value={summary.engagement.totalLikes.toLocaleString()} color="text-pink-600" />
              <MetricCard label="リツイート" value={summary.engagement.totalRetweets.toLocaleString()} color="text-green-600" />
              <MetricCard label="リプライ" value={summary.engagement.totalReplies.toLocaleString()} color="text-blue-600" />
            </div>
          </div>
        </>
      )}

      {/* Daily posts chart */}
      {dailyPosts.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4">過去30日の投稿数</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-32 min-w-0">
              {(() => {
                const dateMap: Record<string, number> = {}
                dailyPosts.forEach(d => {
                  dateMap[d.date] = (dateMap[d.date] || 0) + d.count
                })
                const days = Array.from({ length: 30 }, (_, i) => {
                  const d = new Date()
                  d.setDate(d.getDate() - (29 - i))
                  return d.toISOString().split('T')[0]
                })
                return days.map(date => (
                  <div key={date} className="flex flex-col items-center flex-1 min-w-0" title={`${date}: ${dateMap[date] || 0}件`}>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max(2, ((dateMap[date] || 0) / maxDaily) * 100)}%` }}
                    />
                  </div>
                ))
              })()}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>30日前</span>
              <span>今日</span>
            </div>
          </div>
        </div>
      )}

      {/* Per-account stats */}
      {accounts.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-semibold text-gray-700">アカウント別詳細</h3>
            <select
              className="input w-auto text-sm"
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
            >
              <option value="">アカウントを選択</option>
              {accounts.map(a => <option key={a.id} value={a.id}>@{a.username}</option>)}
            </select>
          </div>

          {accountStats ? (
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                {accountStats.postStats.map(s => (
                  <div key={s.status} className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{s.count}</p>
                    <p className="text-xs text-gray-400">{s.status}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">過去7日 エンゲージメント (mock)</p>
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-gray-400 border-b">
                        <th className="text-left pb-1 pr-4">日付</th>
                        <th className="text-right pb-1 pr-4">IMP</th>
                        <th className="text-right pb-1 pr-4">いいね</th>
                        <th className="text-right pb-1">RT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountStats.metrics.map(m => (
                        <tr key={m.date} className="border-b border-gray-100">
                          <td className="py-1 pr-4 text-gray-600">{m.date}</td>
                          <td className="py-1 pr-4 text-right font-mono">{m.impressions.toLocaleString()}</td>
                          <td className="py-1 pr-4 text-right font-mono text-pink-600">{m.likes}</td>
                          <td className="py-1 text-right font-mono text-green-600">{m.retweets}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">アカウントを選択してください</p>
          )}
        </div>
      )}
    </div>
  )
}
