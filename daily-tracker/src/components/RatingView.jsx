import { useState, useEffect } from 'react'
import { formatDate } from '../lib/storage'

const CATEGORIES = [
  { id: 'health', label: 'H\u00e4lsa', icon: '\uD83D\uDCAA', color: '#22c55e' },
  { id: 'energy', label: 'Energi', icon: '\u26A1', color: '#f59e0b' },
  { id: 'sleep', label: 'S\u00f6mn', icon: '\uD83D\uDE34', color: '#6366f1' },
  { id: 'mood', label: 'Hum\u00f6r', icon: '\uD83D\uDE0A', color: '#ec4899' },
  { id: 'productivity', label: 'Produktivitet', icon: '\uD83D\uDE80', color: '#06b6d4' },
]

export default function RatingView({ date, ratings, onSave }) {
  const [values, setValues] = useState({})

  useEffect(() => {
    setValues(ratings || {})
  }, [ratings, date])

  function handleChange(id, val) {
    const updated = { ...values, [id]: val }
    setValues(updated)
    onSave(updated)
  }

  const avg = CATEGORIES.reduce((sum, c) => sum + (values[c.id] || 0), 0) / CATEGORIES.length

  return (
    <div className="rating-view">
      <div className="view-header">
        <h2>Hur var din dag?</h2>
        <span className="date-label">{formatDate(date)}</span>
      </div>

      {avg > 0 && (
        <div className="avg-score">
          <span className="avg-number">{avg.toFixed(1)}</span>
          <span className="avg-label">snitt</span>
        </div>
      )}

      <div className="rating-cards">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="rating-card">
            <div className="rating-card-header">
              <span className="rating-icon">{cat.icon}</span>
              <span className="rating-label">{cat.label}</span>
              <span className="rating-value" style={{ color: cat.color }}>
                {values[cat.id] || '-'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={values[cat.id] || 5}
              onChange={(e) => handleChange(cat.id, Number(e.target.value))}
              className="rating-slider"
              style={{ accentColor: cat.color }}
            />
            <div className="rating-scale">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
