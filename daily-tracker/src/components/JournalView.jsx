import { useState, useEffect } from 'react'
import { formatDate } from '../lib/storage'

// Backward compat: journal can be a string (old) or object (new)
function parseJournal(journal) {
  if (!journal) return { gratitude: '', text: '' }
  if (typeof journal === 'string') return { gratitude: '', text: journal }
  return { gratitude: journal.gratitude || '', text: journal.text || '' }
}

export default function JournalView({ date, journal, onSave }) {
  const [gratitude, setGratitude] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    const parsed = parseJournal(journal)
    setGratitude(parsed.gratitude)
    setText(parsed.text)
  }, [journal, date])

  function save(newGratitude, newText) {
    onSave({ gratitude: newGratitude, text: newText })
  }

  function handleGratitudeChange(e) {
    const val = e.target.value
    setGratitude(val)
    save(val, text)
  }

  function handleTextChange(e) {
    const val = e.target.value
    setText(val)
    save(gratitude, val)
  }

  const hasContent = gratitude.length > 0 || text.length > 0

  return (
    <div className="journal-view">
      <div className="view-header">
        <h2>Dagbok</h2>
        <span className="date-label">{formatDate(date)}</span>
      </div>

      <div className="journal-question">
        <label className="question-label">
          <span className="question-icon">{'\uD83D\uDE4F'}</span>
          Vad \u00e4r du tacksam f\u00f6r idag?
        </label>
        <textarea
          className="journal-textarea gratitude-textarea"
          placeholder="Skriv h\u00e4r..."
          value={gratitude}
          onChange={handleGratitudeChange}
          rows={3}
        />
      </div>

      <div className="journal-freetext">
        <label className="question-label">
          <span className="question-icon">{'\uD83D\uDCDD'}</span>
          Fri text <span className="optional-tag">(valfritt)</span>
        </label>
        <textarea
          className="journal-textarea"
          placeholder="\u00d6vriga tankar, reflektioner..."
          value={text}
          onChange={handleTextChange}
          rows={6}
        />
      </div>

      <div className="journal-footer">
        <span className="char-count">{gratitude.length + text.length} tecken</span>
        {hasContent && <span className="saved-indicator">{'\u2713'} Sparad</span>}
      </div>
    </div>
  )
}
