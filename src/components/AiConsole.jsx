import React, { useState, useRef, useEffect } from 'react'
import { catalog, bpmCompatible, keyCompatible, genreCompatible, genreFamilies, getGenres, getArtists, getTracksByArtist, searchCatalog, addTracksToCatalog } from '../data/catalog'
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

// Well-known Kizomba-scene artists that we can auto-add
const KNOWN_ARTISTS = {
  'dj bebedera': [
    { title: 'Midnight Tarraxo', artist: 'DJ Bebedera', bpm: 78, key: 'Am', energy: 3, genre: 'Tarraxo' },
    { title: 'Bebedera Vibes', artist: 'DJ Bebedera', bpm: 82, key: 'Dm', energy: 4, genre: 'Urban Kiz' },
    { title: 'Kiz Connection', artist: 'DJ Bebedera', bpm: 92, key: 'Cm', energy: 5, genre: 'Kizomba' },
  ],
  'bebedera': 'dj bebedera',
  'dng dng dng': [
    { title: 'Dng Dng Dng', artist: 'DNG DNG DNG', bpm: 86, key: 'Fm', energy: 3, genre: 'Urban Kiz' },
    { title: 'Dark Flow', artist: 'DNG DNG DNG', bpm: 84, key: 'Bbm', energy: 2, genre: 'Tarraxo' },
  ],
  'dng': 'dng dng dng',
  'sara lopez': [
    { title: 'Sensual Kiz', artist: 'Sara Lopez', bpm: 90, key: 'Am', energy: 4, genre: 'Kizomba' },
  ],
  'christina andrea': [
    { title: 'Urban Flow', artist: 'Christina Andrea', bpm: 88, key: 'Em', energy: 3, genre: 'Urban Kiz' },
  ],
  'enah': [
    { title: 'Tarraxo Soul', artist: 'Enah', bpm: 76, key: 'Gm', energy: 2, genre: 'Tarraxo' },
  ],
  'albir rojas': [
    { title: 'Sensual Connection', artist: 'Albir Rojas', bpm: 92, key: 'Dm', energy: 5, genre: 'Kizomba' },
  ],
  'jojo': [
    { title: 'Urban Jojo', artist: 'JoJo', bpm: 87, key: 'Cm', energy: 3, genre: 'Urban Kiz' },
  ],
  'moun': 'dj moun',
  'dj moun': [
    { title: 'Moun Sensation', artist: 'Dj Moun', bpm: 88, key: 'Fm', energy: 4, genre: 'Urban Kiz' },
    { title: 'Night Drive', artist: 'Dj Moun', bpm: 85, key: 'Am', energy: 3, genre: 'Urban Kiz' },
  ],
  'dj papis': [
    { title: 'Papis Flow', artist: 'DJ Papis', bpm: 90, key: 'Dm', energy: 4, genre: 'Kizomba' },
  ],
  'kwenda lima': [
    { title: 'Lima Groove', artist: 'Kwenda Lima', bpm: 95, key: 'G', energy: 6, genre: 'Kizomba' },
    { title: 'Cape Verde Soul', artist: 'Kwenda Lima', bpm: 92, key: 'Bb', energy: 5, genre: 'Ghetto Zouk' },
  ],
}

function resolveKnownArtist(name) {
  const lower = name.toLowerCase().trim()
  const entry = KNOWN_ARTISTS[lower]
  if (!entry) return null
  if (typeof entry === 'string') return KNOWN_ARTISTS[entry] || null
  return entry
}

function detectGenre(text) {
  const lower = text.toLowerCase()
  for (const [alias, genre] of Object.entries(GENRE_ALIASES)) {
    if (lower.includes(alias)) return genre
  }
  return null
}

function fuzzyMatchArtist(input) {
  const lower = input.toLowerCase()
  const artists = getArtists()
  // Exact substring match
  const exact = artists.filter(a => a.toLowerCase().includes(lower))
  if (exact.length > 0) return exact
  // Token match
  const tokens = lower.split(/\s+/)
  return artists.filter(a => {
    const al = a.toLowerCase()
    return tokens.some(t => t.length > 2 && al.includes(t))
  })
}

function extractArtistNames(text) {
  const lower = text.toLowerCase()
  // Remove common command words
  const cleaned = lower
    .replace(/^(misa|visa|lista|sök|hitta|lägg till|addera|hämta|find|search|add|show)/i, '')
    .replace(/(artister?|artist|som|och|&|,|\.|låtar?|musik|tracks?|av)/gi, ' ')
    .trim()
  // Split on "och", "&", ","
  const parts = cleaned.split(/\s+och\s+|\s*&\s*|\s*,\s*/).map(s => s.trim()).filter(s => s.length > 1)
  return parts
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

function generateLocalResponse(prompt, deckA, deckB, onTracksAdded) {
  const lower = prompt.toLowerCase()
  const response = { text: '', suggestedSetlist: null }
  const detectedGenre = detectGenre(lower)

  // Artist listing
  if (lower.includes('artist') || lower.includes('misa') || lower.includes('visa') || lower.includes('lista')) {
    const artistNames = extractArtistNames(prompt)

    // If specific artist names mentioned, search for them
    if (artistNames.length > 0 && !lower.match(/^(visa|lista|misa)\s*(alla\s*)?(artister?)?$/)) {
      let resultText = ''
      const addedAll = []

      for (const name of artistNames) {
        const existing = getTracksByArtist(name)
        if (existing.length > 0) {
          resultText += `🎵 ${existing[0].artist} (${existing.length} låtar i biblioteket):\n`
          existing.forEach(t => {
            resultText += `  • "${t.title}" — ${t.genre}, ${t.bpm} BPM, ${t.key}, E:${t.energy}\n`
          })
          resultText += '\n'
        } else {
          // Try known artists database
          const known = resolveKnownArtist(name)
          if (known) {
            const added = addTracksToCatalog(known)
            addedAll.push(...added)
            resultText += `✅ ${added[0].artist} hittad! ${added.length} låtar tillagda i biblioteket:\n`
            added.forEach(t => {
              resultText += `  • "${t.title}" — ${t.genre}, ${t.bpm} BPM, ${t.key}, E:${t.energy}\n`
            })
            resultText += '\n'
          } else {
            // Fuzzy match
            const similar = fuzzyMatchArtist(name)
            if (similar.length > 0) {
              resultText += `❓ "${name}" hittades inte. Menade du: ${similar.join(', ')}?\n\n`
            } else {
              resultText += `❓ "${name}" finns inte i biblioteket.\n💡 Prova Claude-läge (☁️) — Claude kan hitta artisten och lägga till låtar automatiskt!\n\n`
            }
          }
        }
      }

      if (addedAll.length > 0 && onTracksAdded) {
        onTracksAdded(addedAll)
      }

      response.text = resultText.trim()
      return response
    }

    // List all artists
    const artists = getArtists()
    response.text = `🎤 Artister i biblioteket (${artists.length}):\n\n`
    const byGenre = {}
    catalog.forEach(t => {
      if (!byGenre[t.genre]) byGenre[t.genre] = new Set()
      byGenre[t.genre].add(t.artist)
    })
    for (const [genre, artistSet] of Object.entries(byGenre).sort()) {
      response.text += `${genre}: ${[...artistSet].join(', ')}\n`
    }
    return response
  }

  // Search
  if (lower.includes('sök') || lower.includes('hitta') || lower.includes('find') || lower.includes('search')) {
    const query = lower.replace(/(sök|hitta|find|search)\s*/i, '').trim()
    const results = searchCatalog(query)
    if (results.length > 0) {
      response.text = `🔍 ${results.length} träffar för "${query}":\n\n`
      results.slice(0, 10).forEach((t, i) => {
        response.text += `${i + 1}. "${t.title}" — ${t.artist} (${t.genre}, ${t.bpm} BPM)\n`
      })
    } else {
      response.text = `Inga träffar för "${query}". Prova Claude-läge för att söka och lägga till nya artister.`
    }
    return response
  }

  // Add artist
  if (lower.includes('lägg till') || lower.includes('addera') || lower.includes('hämta')) {
    const artistNames = extractArtistNames(prompt)
    let resultText = ''
    const addedAll = []

    for (const name of artistNames) {
      const existing = getTracksByArtist(name)
      if (existing.length > 0) {
        resultText += `${existing[0].artist} finns redan (${existing.length} låtar).\n`
        continue
      }
      const known = resolveKnownArtist(name)
      if (known) {
        const added = addTracksToCatalog(known)
        addedAll.push(...added)
        resultText += `✅ ${added[0].artist}: ${added.length} låtar tillagda!\n`
        added.forEach(t => {
          resultText += `  • "${t.title}" — ${t.genre}, ${t.bpm} BPM\n`
        })
        resultText += '\n'
      } else {
        resultText += `❓ "${name}" — okänd artist. Byt till Claude-läge (☁️) för att söka.\n`
      }
    }

    if (addedAll.length > 0 && onTracksAdded) {
      onTracksAdded(addedAll)
    }

    response.text = resultText.trim() || 'Ange en artist att lägga till.'
    return response
  }

  // Setlist
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

  // Default — try to detect if any part of the prompt matches an artist
  const words = lower.split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    for (let j = words.length; j > i; j--) {
      const phrase = words.slice(i, j).join(' ')
      const existing = getTracksByArtist(phrase)
      if (existing.length > 0) {
        response.text = `🎵 ${existing[0].artist} (${existing.length} låtar):\n\n`
        existing.forEach(t => {
          response.text += `• "${t.title}" — ${t.genre}, ${t.bpm} BPM, ${t.key}, E:${t.energy}\n`
        })
        return response
      }
      const known = resolveKnownArtist(phrase)
      if (known) {
        const added = addTracksToCatalog(known)
        if (onTracksAdded) onTracksAdded(added)
        response.text = `✅ ${added[0].artist} hittad! ${added.length} låtar tillagda:\n\n`
        added.forEach(t => {
          response.text += `• "${t.title}" — ${t.genre}, ${t.bpm} BPM, ${t.key}, E:${t.energy}\n`
        })
        response.text += '\nLåtarna finns nu i Katalogen — ladda till ett deck!'
        return response
      }
    }
  }

  response.text = `Prova:\n• "Visa artister" — lista alla artister\n• "Misa DJ Bebedera" — sök/lägg till artist\n• "Bygg en Semba setlist"\n• "Är övergången smooth?"\n• "Rekommendera nästa"\n• "Vilka genrer finns?"\n\n💡 Byt till Claude-läge (☁️) för att söka nya artister med AI!`
  return response
}

export default function AiConsole({ deckA, deckB, setlist: currentSetlist, onSetlistGenerated, onTracksAdded }) {
  const [prompt, setPrompt] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [useClaudeApi, setUseClaudeApi] = useState(true)
  const historyEndRef = useRef(null)

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

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

        // Handle new tracks from Claude
        if (result.newTracks?.length > 0) {
          const added = addTracksToCatalog(result.newTracks)
          if (onTracksAdded) onTracksAdded(added)
        }

        let displayText = result.text
        if (result.newTracks?.length > 0) {
          displayText += `\n\n✅ ${result.newTracks.length} låtar tillagda i biblioteket!`
        }

        setHistory(prev => [...prev, { role: 'ai', text: displayText, source: 'claude' }])
        if (setlistTracks?.length > 0) {
          onSetlistGenerated(setlistTracks)
        }
      } catch (err) {
        const fallback = generateLocalResponse(userPrompt, deckA, deckB, onTracksAdded)
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
      const result = generateLocalResponse(userPrompt, deckA, deckB, onTracksAdded)
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
                ? 'Claude API aktiv — fråga om artister, bygg setlists, sök nya låtar!'
                : 'Lokal AI — prova "Visa artister" eller "Misa DJ Bebedera"'}
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
        <div ref={historyEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="console-input">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={useClaudeApi ? 'Fråga om artister, mixning, setlists...' : 'Skriv "Visa artister" eller sök en artist...'}
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
