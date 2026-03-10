import { useState, useEffect } from 'react'
import RatingView from './components/RatingView'
import JournalView from './components/JournalView'
import AnalyticsView from './components/AnalyticsView'
import { loadEntries, saveEntry, getToday } from './lib/storage'

const TABS = [
  { id: 'rate', label: 'Betyg', icon: '\u2B50' },
  { id: 'journal', label: 'Journal', icon: '\uD83D\uDCDD' },
  { id: 'analytics', label: 'Analys', icon: '\uD83D\uDCCA' },
]

export default function App() {
  const [tab, setTab] = useState('rate')
  const [entries, setEntries] = useState({})
  const [selectedDate, setSelectedDate] = useState(getToday())

  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  function handleSaveRatings(date, ratings) {
    const updated = {
      ...entries,
      [date]: { ...entries[date], ratings, date },
    }
    setEntries(updated)
    saveEntry(date, updated[date])
  }

  function handleSaveJournal(date, journal) {
    const updated = {
      ...entries,
      [date]: { ...entries[date], journal, date },
    }
    setEntries(updated)
    saveEntry(date, updated[date])
  }

  const todayEntry = entries[selectedDate] || {}

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="logo">Daily Tracker</h1>
        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </header>

      <nav className="tab-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'rate' && (
          <RatingView
            date={selectedDate}
            ratings={todayEntry.ratings}
            onSave={(ratings) => handleSaveRatings(selectedDate, ratings)}
          />
        )}
        {tab === 'journal' && (
          <JournalView
            date={selectedDate}
            journal={todayEntry.journal}
            onSave={(journal) => handleSaveJournal(selectedDate, journal)}
          />
        )}
        {tab === 'analytics' && (
          <AnalyticsView entries={entries} />
        )}
      </main>
    </div>
  )
}
