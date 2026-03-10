import { useMemo } from 'react'

const CATEGORIES = [
  { id: 'health', label: 'Halsa', icon: '\uD83D\uDCAA', color: '#22c55e' },
  { id: 'energy', label: 'Energi', icon: '\u26A1', color: '#f59e0b' },
  { id: 'sleep', label: 'Somn', icon: '\uD83D\uDE34', color: '#6366f1' },
  { id: 'mood', label: 'Humor', icon: '\uD83D\uDE0A', color: '#ec4899' },
  { id: 'productivity', label: 'Produktivitet', icon: '\uD83D\uDE80', color: '#06b6d4' },
]

export default function AnalyticsView({ entries }) {
  const stats = useMemo(() => {
    const dates = Object.keys(entries).sort().slice(-30)
    if (dates.length === 0) return null

    const avgs = {}
    CATEGORIES.forEach((cat) => {
      const vals = dates
        .map((d) => entries[d]?.ratings?.[cat.id])
        .filter((v) => v != null)
      avgs[cat.id] = vals.length > 0
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : 0
    })

    const overallAvg =
      Object.values(avgs).reduce((a, b) => a + b, 0) / CATEGORIES.length

    const journalDays = dates.filter((d) => entries[d]?.journal?.length > 0).length
    const streak = calculateStreak(dates)

    const trend = calculateTrend(entries, dates)

    return { dates, avgs, overallAvg, journalDays, streak, trend }
  }, [entries])

  if (!stats) {
    return (
      <div className="analytics-view">
        <div className="view-header">
          <h2>Analys</h2>
        </div>
        <div className="analytics-empty">
          <span className="empty-icon">{'\uD83D\uDCCA'}</span>
          <p>Ingen data annu. Borja med att betygsatta din dag!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-view">
      <div className="view-header">
        <h2>Analys</h2>
        <span className="date-label">Senaste {stats.dates.length} dagar</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-highlight">
          <span className="stat-value">{stats.overallAvg.toFixed(1)}</span>
          <span className="stat-label">Snitt</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.dates.length}</span>
          <span className="stat-label">Dagar</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.streak}</span>
          <span className="stat-label">Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.journalDays}</span>
          <span className="stat-label">Journal</span>
        </div>
      </div>

      <div className="category-bars">
        <h3>Kategorier (snitt)</h3>
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="bar-row">
            <span className="bar-icon">{cat.icon}</span>
            <span className="bar-label">{cat.label}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(stats.avgs[cat.id] / 10) * 100}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
            <span className="bar-value" style={{ color: cat.color }}>
              {stats.avgs[cat.id].toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {stats.trend && (
        <div className="trend-section">
          <h3>Trend (7 dagar)</h3>
          <div className={`trend-badge trend-${stats.trend.direction}`}>
            {stats.trend.direction === 'up' ? '\u2191' : stats.trend.direction === 'down' ? '\u2193' : '\u2192'}
            {' '}
            {stats.trend.direction === 'up'
              ? 'Uppat'
              : stats.trend.direction === 'down'
              ? 'Nedat'
              : 'Stabilt'}
            {stats.trend.diff !== 0 && ` (${stats.trend.diff > 0 ? '+' : ''}${stats.trend.diff.toFixed(1)})`}
          </div>
        </div>
      )}

      <div className="history-section">
        <h3>Historik</h3>
        <div className="history-list">
          {stats.dates.slice().reverse().map((date) => {
            const entry = entries[date]
            const rats = entry?.ratings || {}
            const avg =
              Object.values(rats).length > 0
                ? Object.values(rats).reduce((a, b) => a + b, 0) /
                  Object.values(rats).length
                : 0
            return (
              <div key={date} className="history-row">
                <span className="history-date">
                  {new Date(date + 'T12:00:00').toLocaleDateString('sv-SE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <div className="history-dots">
                  {CATEGORIES.map((cat) => (
                    <span
                      key={cat.id}
                      className="history-dot"
                      style={{
                        backgroundColor: rats[cat.id]
                          ? cat.color
                          : 'transparent',
                        borderColor: cat.color,
                        opacity: rats[cat.id] ? rats[cat.id] / 10 : 0.2,
                      }}
                      title={`${cat.label}: ${rats[cat.id] || '-'}`}
                    />
                  ))}
                </div>
                <span className="history-avg">{avg > 0 ? avg.toFixed(1) : '-'}</span>
                {entry?.journal && <span className="history-journal">{'\uD83D\uDCDD'}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function calculateStreak(dates) {
  if (dates.length === 0) return 0
  let streak = 1
  for (let i = dates.length - 1; i > 0; i--) {
    const curr = new Date(dates[i] + 'T12:00:00')
    const prev = new Date(dates[i - 1] + 'T12:00:00')
    const diff = (curr - prev) / (1000 * 60 * 60 * 24)
    if (diff === 1) streak++
    else break
  }
  return streak
}

function calculateTrend(entries, dates) {
  if (dates.length < 7) return null
  const recent = dates.slice(-7)
  const older = dates.slice(-14, -7)
  if (older.length === 0) return null

  function avgForDates(ds) {
    let total = 0, count = 0
    ds.forEach((d) => {
      const rats = entries[d]?.ratings
      if (rats) {
        const vals = Object.values(rats)
        if (vals.length > 0) {
          total += vals.reduce((a, b) => a + b, 0) / vals.length
          count++
        }
      }
    })
    return count > 0 ? total / count : 0
  }

  const recentAvg = avgForDates(recent)
  const olderAvg = avgForDates(older)
  const diff = recentAvg - olderAvg

  return {
    diff,
    direction: diff > 0.3 ? 'up' : diff < -0.3 ? 'down' : 'stable',
  }
}
