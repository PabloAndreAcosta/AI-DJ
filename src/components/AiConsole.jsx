import React, { useState } from 'react'
import { catalog, bpmCompatible, keyCompatible, genreCompatible, genreFamilies, getGenres } from '../data/catalog'
import { chatWithClaude } from '../lib/claude'

const GENRE_ALIASES = {
  'kiz': 'Kizomba', 'kizomba': 'Kizomba',
  'urban': 'Urban Kiz', 'urban kiz': 'Urban Kiz', 'urbankiz': 'Urban Kiz',
  'ghetto': 'Ghetto Zouk', 'ghetto zouk': 'Ghetto Zouk', 'ghettozouk': 'Ghetto Zouk',
  'tarraxo': 'Tarraxo', 'tarraxa': 'Tarraxo', 'tarraxinha': 'Tarraxo',
  'semba': 'Semba',
  'zouk': 'Zouk',
  'afrobeats': 'Afrobeats', 'afrobeat': 'Afrobeats', 'afro': 'Afrobeats',
  'cumbia': 'Electro Cumbia', 'electro cumbia': 'Electro Cumbia',
  'folktronic': 'Folktronic', 'folk': 'Folktronic',
  'kuduro': 'Kuduro',
  'kompa': 'Kompa',
  'afro house': 'Afro House', 'afrohouse': 'Afro House',
}

function detectGenre(text) {
  const lower = text.toLowerCase()
  for (const [alias, genre] of Object.entries(GENRE_ALIASES)) {
    if (lower.includes(alias)) return genre
  }
  return null
}

function buildSetlist(options = {}) {
  const { genre, count = 6, curve = 'warmup' } = options
  let pool = genre ? catalog.filter(t => t.genre === genre) : [...catalog]
  if (pool.length === 0) return null

  let sorted
  switch (curve) {
    case 'peak':
      sorted = [...pool].sort((a, b) => b.energy - a.energy)
      break
    case 'journey': {
      const genreOrder = ['Tarraxo', 'Urban Kiz', 'Kizomba', 'Ghetto Zouk', 'Kompa', 'Semba', 'Afrobeats', 'Electro Cumbia', 'Zouk', 'Afro House', 'Folktronic', 'Kuduro']
      sorted = []
      for (const g of genreOrder) {
        sorted.push(...pool.filter(t => t.genre === g).sort((a, b) => a.energy - b.energy))
      }
      if (sorted.length === 0) sorted = [...pool].sort((a, b) => a.energy - b.energy)
      break
    }
    case 'wave': {
      sorted = [...pool].sort((a, b) => a.energy - b.energy)
      const mid = Math.floor(sorted.length / 2)
      const first = sorted.slice(0, mid)
      const second = sorted.slice(mid).reverse()
      sorted = []
      for (let i = 0; i < Math.max(first.length, second.length); i++) {
        if (i < first.length) sorted.push(first[i])
        if (i < second.length) sorted.push(second[i])
      }
      break
    }
    default:
      sorted = [...pool].sort((a, b) => a.energy - b.energy)
  }

  const result = [sorted[0]]
  const used = new Set([sorted[0].id])
  const remaining = sorted.filter(t => t.id !== sorted[0].id)

  while (result.length < Math.min(count, pool.length) && remaining.length > 0) {
    const last = result[result.length - 1]
    let bestIdx = 0
    let bestScore = -1
    for (let i = 0; i < remaining.length; i++) {
      if (used.has(remaining[i].id)) continue
      let score = 0
      if (bpmCompatible(last.bpm, remaining[i].bpm)) score += 3
      if (genreCompatible(last.genre, remaining[i].genre)) score += 2
      if (keyCompatible(last.key, remaining[i].key)) score += 1
      if (score > bestScore) { bestScore = score; bestIdx = i }
    }
    const pick = remaining.splice(bestIdx, 1)[0]
    used.add(pick.id)
    result.push(pick)
  }

  return result
}

function generateLocalResponse(prompt, deckA, deckB) {
  const lower = prompt.toLowerCase()
  const response = { text: '', suggestedSetlist: null }
  const detectedGenre = detectGenre(lower)

  if (lower.includes('setlist') || lower.includes('set') || lower.includes('bygg') || lower.includes('skapa') || lower.includes('warm')) {
    const count = parseInt(prompt.match(/(\d+)/)?.[1]) || 6
    const isPeak = lower.includes('peak') || lower.includes('bang') || lower.includes('intensiv')
    const isJourney = lower.includes('resa') || lower.includes('journey') || lower.includes('alla genre')
    const isWave = lower.includes('wave') || lower.includes('våg')

    let curve = 'warmup'
    if (isPeak) curve = 'peak'
    else if (isJourney) curve = 'journey'
    else if (isWave) curve = 'wave'

    const setlist = buildSetlist({ genre: detectedGenre, count, curve })
    if (!setlist) {
      response.text = `Hittade inga låtar${detectedGenre ? ` i "${detectedGenre}"` : ''}.`
      return response
    }
    response.suggestedSetlist = setlist
    const genreLabel = detectedGenre ? ` ${detectedGenre}` : ''
    response.text = `${curve}${genreLabel} setlist (${setlist.length} låtar):\n\n`
    setlist.forEach((t, i) => {
      response.text += `${i + 1}. ${t.title} — ${t.artist} (${t.genre}, ${t.bpm} BPM, ${t.key}, E:${t.energy})\n`
    })
    return response
  }

  if (lower.includes('transition') || lower.includes('övergång') || lower.includes('smooth') || lower.includes('mixa')) {
    if (!deckA || !deckB) {
      response.text = 'Ladda låtar på båda decks först.'
      return response
    }
    const bOk = bpmCompatible(deckA.bpm, deckB.bpm)
    const kOk = keyCompatible(deckA.key, deckB.key)
    const gOk = genreCompatible(deckA.genre, deckB.genre)
    response.text = `"${deckA.title}" → "${deckB.title}"\n\nBPM: ${deckA.bpm}→${deckB.bpm} ${bOk ? '✅' : '⚠️'}\nKey: ${deckA.key}→${deckB.key} ${kOk ? '✅' : '⚠️'}\nGenre: ${deckA.genre}→${deckB.genre} ${gOk ? '✅' : '⚠️'}`
    return response
  }

  if (lower.includes('genre') || lower.includes('stil') || lower.includes('vilka')) {
    response.text = 'Genrer:\n\n'
    Object.entries(genreFamilies).forEach(([name, info]) => {
      const count = catalog.filter(t => t.genre === name).length
      response.text += `${name} (${count}) — ${info.bpmRange[0]}-${info.bpmRange[1]} BPM → ${info.transitionTo.join(', ')}\n`
    })
    return response
  }

  if (lower.includes('recommend') || lower.includes('rekommend') || lower.includes('nästa') || lower.includes('föreslå')) {
    const current = deckA || deckB
    if (!current) { response.text = 'Ladda en låt först!'; return response }
    const recs = catalog
      .filter(t => t.id !== current.id)
      .map(t => ({ ...t, score: (bpmCompatible(current.bpm, t.bpm) ? 3 : 0) + (genreCompatible(current.genre, t.genre) ? 2 : 0) + (keyCompatible(current.key, t.key) ? 2 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    response.text = `Rekommendationer efter "${current.title}":\n\n`
    recs.forEach((t, i) => { response.text += `${i + 1}. ${t.title} — ${t.artist} (${t.genre}, ${t.bpm} BPM)\n` })
    return response
  }

  response.text = `Prova:\n• "Bygg en Semba setlist"\n• "Är övergången smooth?"\n• "Rekommendera nästa"\n• "Vilka genrer finns?"`
  return response
}

export default function AiConsole({ deckA, deckB, setlist: currentSetlist, onSetlistGenerated }) {
  const [prompt, setPrompt] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [useClaudeApi, setUseClaudeApi] = useState(true)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim() || loading) return

    const userPrompt = prompt
    setPrompt('')
    setHistory(prev => [...prev, { role: 'user', text: userPrompt }])

    if (useClaudeApi) {
      setLoading(true)
      try {
        const result = await chatWithClaude(userPrompt, deckA, deckB, currentSetlist)

        let setlistTracks = null
        if (result.setlistIds) {
          setlistTracks = result.setlistIds
            .map(id => catalog.find(t => t.id === id))
            .filter(Boolean)
        }

        setHistory(prev => [...prev, { role: 'ai', text: result.text, source: 'claude' }])
        if (setlistTracks?.length > 0) {
          onSetlistGenerated(setlistTracks)
        }
      } catch (err) {
        const fallback = generateLocalResponse(userPrompt, deckA, deckB)
        setHistory(prev => [...prev, {
          role: 'ai',
          text: `⚠️ Claude API ej tillgänglig (${err.message}). Lokal AI:\n\n${fallback.text}`,
          source: 'local'
        }])
        if (fallback.suggestedSetlist) onSetlistGenerated(fallback.suggestedSetlist)
      } finally {
        setLoading(false)
      }
    } else {
      const result = generateLocalResponse(userPrompt, deckA, deckB)
      setHistory(prev => [...prev, { role: 'ai', text: result.text, source: 'local' }])
      if (result.suggestedSetlist) onSetlistGenerated(result.suggestedSetlist)
    }
  }

  return (
    <div className="ai-console">
      <div className="console-header">
        <span className="console-icon">🤖</span>
        <h3>AI DJ Console</h3>
        <button
          className={`mode-toggle ${useClaudeApi ? 'mode-claude' : 'mode-local'}`}
          onClick={() => setUseClaudeApi(!useClaudeApi)}
          title={useClaudeApi ? 'Claude API aktiv' : 'Lokal AI aktiv'}
        >
          {useClaudeApi ? '☁️ Claude' : '💻 Lokal'}
        </button>
        <span className="console-genres">{getGenres().length} genrer · {catalog.length} låtar</span>
      </div>

      <div className="console-history">
        {history.length === 0 && (
          <div className="console-welcome">
            <p>Hej! Jag är din Kizomba AI DJ.</p>
            <p>Jag mixar: Kizomba · Urban Kiz · Ghetto Zouk · Tarraxo · Semba · Zouk · Afrobeats · Electro Cumbia · Folktronic · Kuduro · Kompa · Afro House</p>
            <p className="console-hint">
              {useClaudeApi
                ? 'Claude API aktiv — skriv vad som helst på naturligt språk!'
                : 'Lokal AI — prova "Bygg en warm-up Tarraxo setlist"'}
            </p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`console-msg console-${msg.role}`}>
            <span className="msg-label">
              {msg.role === 'user' ? 'Du' : msg.source === 'claude' ? '☁️ Claude' : '💻 AI DJ'}
            </span>
            <pre className="msg-text">{msg.text}</pre>
          </div>
        ))}
        {loading && (
          <div className="console-msg console-ai">
            <span className="msg-label">☁️ Claude</span>
            <pre className="msg-text loading-dots">Tänker</pre>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="console-input">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={useClaudeApi ? 'Fråga Claude om mixning, setlists, övergångar...' : 'Skriv en DJ-prompt...'}
          className="prompt-input"
          disabled={loading}
        />
        <button type="submit" className="prompt-btn" disabled={loading}>
          {loading ? '...' : 'Skicka'}
        </button>
      </form>
    </div>
  )
}
