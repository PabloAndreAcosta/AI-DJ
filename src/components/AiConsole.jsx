import React, { useState } from 'react'
import { catalog, bpmCompatible, keyCompatible, genreCompatible, genreFamilies, energyLabel, getGenres, getTracksByGenre } from '../data/catalog'

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
  const { genre, count = 6, curve = 'warmup', startBpm, endGenre } = options
  let pool = genre ? catalog.filter(t => t.genre === genre) : [...catalog]

  if (pool.length === 0) return null

  let sorted
  switch (curve) {
    case 'warmup':
      sorted = [...pool].sort((a, b) => a.energy - b.energy)
      break
    case 'peak':
      sorted = [...pool].sort((a, b) => b.energy - a.energy)
      break
    case 'wave':
      // Up-down-up pattern
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
    case 'journey':
      // Cross-genre journey: start slow kiz, build through genres
      const genreOrder = ['Tarraxo', 'Urban Kiz', 'Kizomba', 'Ghetto Zouk', 'Kompa', 'Semba', 'Afrobeats', 'Electro Cumbia', 'Zouk', 'Afro House', 'Folktronic', 'Kuduro']
      sorted = []
      for (const g of genreOrder) {
        const genreTracks = pool.filter(t => t.genre === g).sort((a, b) => a.energy - b.energy)
        sorted.push(...genreTracks)
      }
      if (sorted.length === 0) sorted = [...pool].sort((a, b) => a.energy - b.energy)
      break
    default:
      sorted = [...pool].sort((a, b) => a.energy - b.energy)
  }

  // Smart select: try to pick tracks with smooth BPM transitions
  const result = [sorted[0]]
  const used = new Set([sorted[0].id])
  const remaining = sorted.filter(t => t.id !== sorted[0].id)

  while (result.length < Math.min(count, pool.length) && remaining.length > 0) {
    const last = result[result.length - 1]
    // Prefer BPM-compatible and genre-compatible tracks
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

function generateAiResponse(prompt, deckA, deckB) {
  const lower = prompt.toLowerCase()
  const response = { text: '', suggestedSetlist: null }

  const detectedGenre = detectGenre(lower)

  // === GENRE-SPECIFIC SETLIST ===
  if (lower.includes('setlist') || lower.includes('set list') || lower.includes('warm-up') || lower.includes('warmup') || lower.includes('set') || lower.includes('bygg') || lower.includes('skapa')) {
    const count = parseInt(prompt.match(/(\d+)/)?.[1]) || 6
    const isWarmup = lower.includes('warm') || lower.includes('chill') || lower.includes('lugn')
    const isPeak = lower.includes('peak') || lower.includes('bang') || lower.includes('energi') || lower.includes('intensiv')
    const isJourney = lower.includes('resa') || lower.includes('journey') || lower.includes('mix alla') || lower.includes('alla genre')
    const isWave = lower.includes('wave') || lower.includes('våg')

    let curve = 'warmup'
    if (isPeak) curve = 'peak'
    else if (isJourney) curve = 'journey'
    else if (isWave) curve = 'wave'

    const setlist = buildSetlist({ genre: detectedGenre, count, curve })

    if (!setlist || setlist.length === 0) {
      response.text = `❌ Hittade inga låtar${detectedGenre ? ` i genren "${detectedGenre}"` : ''}. Prova en annan genre!`
      return response
    }

    response.suggestedSetlist = setlist
    const genreLabel = detectedGenre ? ` ${detectedGenre}` : ''
    const curveLabel = { warmup: 'warm-up', peak: 'peak-time', journey: 'genre-journey', wave: 'wave' }[curve]
    response.text = `🎵 ${curveLabel}${genreLabel} setlist med ${setlist.length} låtar:\n\n`
    setlist.forEach((t, i) => {
      const prev = i > 0 ? setlist[i - 1] : null
      let compat = ''
      if (prev) {
        const bOk = bpmCompatible(prev.bpm, t.bpm)
        const gOk = genreCompatible(prev.genre, t.genre)
        compat = ` ${bOk ? '✅' : '⚠️'}BPM ${gOk ? '✅' : '🔄'}Genre`
      }
      response.text += `${i + 1}. ${t.title} — ${t.artist}\n   ${t.bpm} BPM · ${t.key} · ${t.genre} · E:${t.energy}${compat}\n`
    })

    const avgBpm = Math.round(setlist.reduce((s, t) => s + t.bpm, 0) / setlist.length)
    const genres = [...new Set(setlist.map(t => t.genre))]
    response.text += `\n📊 Snitt-BPM: ${avgBpm} | Genrer: ${genres.join(', ')}`
    response.text += `\n💡 ${curve === 'journey' ? 'En resa genom alla stilar — perfekt för en lång natt!' : curve === 'peak' ? 'Full energi! Korta transitions, håll dansarna igång.' : curve === 'wave' ? 'Vågmönster — bygg upp, dra ner, bygg upp igen.' : 'Bygg gradvis. Håll BPM-skiftena mjuka.'}`
    return response
  }

  // === TRANSITION ANALYSIS ===
  if (lower.includes('transition') || lower.includes('övergång') || lower.includes('smooth') || lower.includes('mixa')) {
    if (!deckA || !deckB) {
      response.text = '⚠️ Ladda låtar på båda decks för att analysera övergången.'
      return response
    }
    const bpmOk = bpmCompatible(deckA.bpm, deckB.bpm)
    const keyOk = keyCompatible(deckA.key, deckB.key)
    const gOk = genreCompatible(deckA.genre, deckB.genre)
    const energyDiff = Math.abs(deckA.energy - deckB.energy)

    response.text = `🔍 "${deckA.title}" → "${deckB.title}"\n\n`
    response.text += `BPM: ${deckA.bpm} → ${deckB.bpm} ${bpmOk ? '✅ Smooth' : '⚠️ Stort hopp — tempo-fade behövs'}\n`
    response.text += `Key: ${deckA.key} → ${deckB.key} ${keyOk ? '✅ Harmonisk' : keyOk === null ? '❓ Okänd' : '⚠️ Risk för dissonans'}\n`
    response.text += `Genre: ${deckA.genre} → ${deckB.genre} ${gOk ? '✅ Naturlig övergång' : '⚠️ Genrehopp — kräver brygga'}\n`
    response.text += `Energy: ${deckA.energy} → ${deckB.energy} ${energyDiff <= 2 ? '✅ Jämnt' : energyDiff <= 4 ? '⚠️ Märkbart hopp' : '🔴 Stort hopp'}\n\n`

    if (!gOk) {
      const aInfo = genreFamilies[deckA.genre]
      if (aInfo) {
        const bridge = aInfo.transitionTo.filter(g => genreFamilies[g]?.transitionTo?.includes(deckB.genre))
        if (bridge.length > 0) {
          response.text += `🌉 Brygg-genre: Lägg en ${bridge[0]}-låt mellan för smidigare övergång.\n`
        }
      }
    }

    const score = (bpmOk ? 3 : 0) + (keyOk ? 2 : 0) + (gOk ? 2 : 0) + (energyDiff <= 2 ? 1 : 0)
    if (score >= 7) response.text += '🎯 Perfekt match — kör en 16-takts crossfade!'
    else if (score >= 5) response.text += '🎯 Bra match — använd filter-sweep för att jämna ut.'
    else if (score >= 3) response.text += '🎯 OK match — använd echo-out eller breakdown som brygga.'
    else response.text += '🎯 Tuff övergång — kör en full drop/paus mellan låtarna.'
    return response
  }

  // === GENRE INFO ===
  if (lower.includes('genre') || lower.includes('stil') || lower.includes('vilka')) {
    const genres = Object.entries(genreFamilies)
    response.text = '🎶 Genrer i Kizomba-paraplyet:\n\n'
    genres.forEach(([name, info]) => {
      const count = catalog.filter(t => t.genre === name).length
      response.text += `${name} (${count} låtar) — ${info.bpmRange[0]}-${info.bpmRange[1]} BPM\n`
      response.text += `  → Mixar bra med: ${info.transitionTo.join(', ')}\n\n`
    })
    return response
  }

  // === BPM ANALYSIS ===
  if (lower.includes('bpm') || lower.includes('tempo')) {
    if (detectedGenre) {
      const tracks = catalog.filter(t => t.genre === detectedGenre)
      const avg = Math.round(tracks.reduce((s, t) => s + t.bpm, 0) / tracks.length)
      response.text = `📊 ${detectedGenre} BPM-analys:\n\n`
      response.text += `Låtar: ${tracks.length}\nSnitt: ${avg} BPM\n`
      response.text += `Range: ${Math.min(...tracks.map(t => t.bpm))}–${Math.max(...tracks.map(t => t.bpm))} BPM`
    } else {
      response.text = '📊 BPM per genre:\n\n'
      for (const [name, info] of Object.entries(genreFamilies)) {
        const count = catalog.filter(t => t.genre === name).length
        if (count > 0) response.text += `${name}: ${info.bpmRange[0]}–${info.bpmRange[1]} BPM (${count} låtar)\n`
      }
    }
    return response
  }

  // === RECOMMEND NEXT ===
  if (lower.includes('recommend') || lower.includes('rekommend') || lower.includes('suggest') || lower.includes('föreslå') || lower.includes('nästa')) {
    const current = deckA || deckB
    if (!current) {
      response.text = 'Ladda en låt på något deck först!'
      return response
    }

    const compatible = catalog
      .filter(t => t.id !== current.id)
      .map(t => {
        let score = 0
        if (bpmCompatible(current.bpm, t.bpm)) score += 3
        if (genreCompatible(current.genre, t.genre)) score += 2
        if (keyCompatible(current.key, t.key)) score += 2
        if (Math.abs(current.energy - t.energy) <= 2) score += 1
        return { ...t, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    response.text = `🎵 Rekommendationer efter "${current.title}" (${current.genre}, ${current.bpm} BPM):\n\n`
    compatible.forEach((t, i) => {
      const stars = '★'.repeat(Math.min(t.score, 5)) + '☆'.repeat(Math.max(0, 5 - t.score))
      response.text += `${i + 1}. ${t.title} — ${t.artist}\n   ${t.genre} · ${t.bpm} BPM · ${t.key} · E:${t.energy}  ${stars}\n`
    })
    return response
  }

  // === HELP ===
  response.text = `🤖 Kizomba AI DJ — kommandon:\n\n`
  response.text += `📋 Setlists:\n`
  response.text += `  • "Bygg en 6-låtars warm-up setlist"\n`
  response.text += `  • "Skapa en peak-time Semba setlist med 4 låtar"\n`
  response.text += `  • "Bygg en journey-set med alla genrer"\n`
  response.text += `  • "Ge mig en Tarraxo chill setlist"\n`
  response.text += `  • "Cumbia wave setlist 8 låtar"\n\n`
  response.text += `🔀 Övergångar:\n`
  response.text += `  • "Är övergången smooth?" (ladda 2 decks)\n`
  response.text += `  • "Analysera transition"\n\n`
  response.text += `🎵 Info:\n`
  response.text += `  • "Vilka genrer finns?"\n`
  response.text += `  • "BPM för Kizomba"\n`
  response.text += `  • "Rekommendera nästa låt"\n`
  return response
}

export default function AiConsole({ deckA, deckB, onSetlistGenerated }) {
  const [prompt, setPrompt] = useState('')
  const [history, setHistory] = useState([])

  function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim()) return

    const result = generateAiResponse(prompt, deckA, deckB)
    setHistory(prev => [...prev, { role: 'user', text: prompt }, { role: 'ai', text: result.text }])

    if (result.suggestedSetlist) {
      onSetlistGenerated(result.suggestedSetlist)
    }
    setPrompt('')
  }

  return (
    <div className="ai-console">
      <div className="console-header">
        <span className="console-icon">🤖</span>
        <h3>AI DJ Console</h3>
        <span className="console-genres">{getGenres().length} genrer · {catalog.length} låtar</span>
      </div>

      <div className="console-history">
        {history.length === 0 && (
          <div className="console-welcome">
            <p>Hej! Jag är din Kizomba AI DJ.</p>
            <p>Jag mixar: Kizomba · Urban Kiz · Ghetto Zouk · Tarraxo · Semba · Zouk · Afrobeats · Electro Cumbia · Folktronic · Kuduro · Kompa · Afro House</p>
            <p className="console-hint">Prova: "Bygg en warm-up Tarraxo setlist" eller "Journey-set med alla genrer"</p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`console-msg console-${msg.role}`}>
            <span className="msg-label">{msg.role === 'user' ? 'Du' : 'AI DJ'}</span>
            <pre className="msg-text">{msg.text}</pre>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="console-input">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Skriv en DJ-prompt... t.ex. 'Semba peak setlist 5 låtar'"
          className="prompt-input"
        />
        <button type="submit" className="prompt-btn">Skicka</button>
      </form>
    </div>
  )
}
