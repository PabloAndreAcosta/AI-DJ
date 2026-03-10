import { useState, useEffect } from 'react'
import { formatDate } from '../lib/storage'

const PROMPTS = [
  'Vad ar du tacksamm for idag?',
  'Vad gick bra idag?',
  'Vad kunde du ha gjort battre?',
  'Vilka mal har du for imorgon?',
  'Hur kande du dig idag?',
  'Vad larde du dig idag?',
  'Vem uppskattade du idag?',
  'Vad gav dig energi idag?',
]

export default function JournalView({ date, journal, onSave }) {
  const [text, setText] = useState('')
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    setText(journal || '')
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  }, [journal, date])

  function handleChange(e) {
    const val = e.target.value
    setText(val)
    onSave(val)
  }

  function handleNewPrompt() {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  }

  return (
    <div className="journal-view">
      <div className="view-header">
        <h2>Dagbok</h2>
        <span className="date-label">{formatDate(date)}</span>
      </div>

      <div className="journal-prompt" onClick={handleNewPrompt}>
        <span className="prompt-icon">{'\uD83D\uDCA1'}</span>
        <span>{prompt}</span>
        <span className="prompt-refresh">{'\u21BB'}</span>
      </div>

      <textarea
        className="journal-textarea"
        placeholder="Skriv dina tankar har..."
        value={text}
        onChange={handleChange}
        rows={10}
      />

      <div className="journal-footer">
        <span className="char-count">{text.length} tecken</span>
        {text && <span className="saved-indicator">{'\u2713'} Sparad</span>}
      </div>
    </div>
  )
}
