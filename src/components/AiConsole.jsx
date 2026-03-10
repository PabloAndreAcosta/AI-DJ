import React, { useState } from 'react'
import { catalog, bpmCompatible, keyCompatible, energyLabel } from '../data/catalog'

function generateAiResponse(prompt, deckA, deckB) {
  const lower = prompt.toLowerCase()
  const response = { text: '', suggestedSetlist: null }

  if (lower.includes('setlist') || lower.includes('set list') || lower.includes('warm-up') || lower.includes('warmup')) {
    const count = parseInt(prompt.match(/(\d+)/)?.[1]) || 6
    const isWarmup = lower.includes('warm-up') || lower.includes('warmup') || lower.includes('chill')
    const isPeak = lower.includes('peak') || lower.includes('bang') || lower.includes('energy')

    let sorted
    if (isWarmup) {
      sorted = [...catalog].sort((a, b) => a.energy - b.energy)
    } else if (isPeak) {
      sorted = [...catalog].sort((a, b) => b.energy - a.energy)
    } else {
      sorted = [...catalog].sort((a, b) => a.energy - b.energy)
    }

    const setlist = sorted.slice(0, Math.min(count, sorted.length))
    response.suggestedSetlist = setlist
    response.text = `🎵 Här är en ${isWarmup ? 'warm-up' : isPeak ? 'peak-time' : ''} setlist med ${setlist.length} låtar:\n\n`
    setlist.forEach((t, i) => {
      response.text += `${i + 1}. ${t.title} — ${t.artist} (${t.bpm} BPM, ${t.key}, Energy: ${t.energy})\n`
    })
    response.text += `\n💡 Tips: ${isWarmup ? 'Börja lugnt och bygg gradvis. Håll BPM-skiftena under 4 BPM mellan låtarna.' : isPeak ? 'Maxa energin! Använd korta transitions och håll dansarna i rörelse.' : 'Bygg energin successivt för en naturlig setupplevelse.'}`
    return response
  }

  if (lower.includes('transition') || lower.includes('övergång') || lower.includes('smooth') || lower.includes('mix')) {
    if (!deckA || !deckB) {
      response.text = '⚠️ Ladda låtar på båda decks för att jag ska kunna analysera övergången.'
      return response
    }
    const bpmOk = bpmCompatible(deckA.bpm, deckB.bpm)
    const keyOk = keyCompatible(deckA.key, deckB.key)
    const energyDiff = Math.abs(deckA.energy - deckB.energy)

    response.text = `🔍 Analys: "${deckA.title}" → "${deckB.title}"\n\n`
    response.text += `BPM: ${deckA.bpm} → ${deckB.bpm} (${bpmOk ? '✅ Smooth — inom 6 BPM' : '⚠️ Stor skillnad — överväg tempo-fade'})\n`
    response.text += `Key: ${deckA.key} → ${deckB.key} (${keyOk ? '✅ Harmoniskt kompatibla' : keyOk === null ? '❓ Kan inte avgöra' : '⚠️ Riskfylld — kan dissonera'})\n`
    response.text += `Energy: ${deckA.energy} → ${deckB.energy} (${energyDiff <= 2 ? '✅ Jämn övergång' : energyDiff <= 4 ? '⚠️ Märkbart hopp' : '🔴 Stort hopp — förbered dansarna'})\n\n`

    if (bpmOk && keyOk) {
      response.text += '🎯 Rekommendation: Perfekt match! Kör en 16-takts crossfade för en seamless övergång.'
    } else if (bpmOk) {
      response.text += '🎯 Rekommendation: BPM matchar bra. Använd ett filter-sweep eller echo-out för att dölja key-skillnaden.'
    } else {
      response.text += '🎯 Rekommendation: Använd en breakdown eller vocal drop som brygga mellan låtarna. Undvik direkt beatmatch.'
    }
    return response
  }

  if (lower.includes('bpm') || lower.includes('tempo')) {
    const avgBpm = Math.round(catalog.reduce((s, t) => s + t.bpm, 0) / catalog.length)
    response.text = `📊 BPM-analys av katalogen:\n\n`
    response.text += `Genomsnitt: ${avgBpm} BPM\n`
    response.text += `Lägst: ${Math.min(...catalog.map(t => t.bpm))} BPM\n`
    response.text += `Högst: ${Math.max(...catalog.map(t => t.bpm))} BPM\n\n`
    response.text += `Kizomba-range: 88-98 BPM (sweet spot)\nSemba: 100-115 BPM\nAfrobeats: 105-120 BPM`
    return response
  }

  if (lower.includes('recommend') || lower.includes('rekommend') || lower.includes('suggest') || lower.includes('föreslå') || lower.includes('nästa')) {
    const current = deckA || deckB
    if (!current) {
      response.text = 'Ladda en låt på något deck först, så rekommenderar jag nästa!'
      return response
    }
    const compatible = catalog
      .filter(t => t.id !== current.id && bpmCompatible(current.bpm, t.bpm))
      .sort((a, b) => Math.abs(a.energy - current.energy) - Math.abs(b.energy - current.energy))
      .slice(0, 3)

    response.text = `🎵 Baserat på "${current.title}" (${current.bpm} BPM, ${current.key}, E:${current.energy}):\n\n`
    if (compatible.length > 0) {
      compatible.forEach((t, i) => {
        const kOk = keyCompatible(current.key, t.key)
        response.text += `${i + 1}. ${t.title} — ${t.artist} (${t.bpm} BPM, ${t.key}, E:${t.energy}) ${kOk ? '🔑✅' : ''}\n`
      })
    } else {
      response.text += 'Inga perfekta BPM-matchningar. Prova tempo-sync eller en genre-switch!'
    }
    return response
  }

  response.text = `🤖 Kizomba AI DJ här! Prova:\n\n• "Bygg en 6-låtars warm-up setlist"\n• "Är övergången smooth?" (ladda 2 decks)\n• "Rekommendera nästa låt"\n• "Analysera BPM i katalogen"\n• "Ge mig en peak-time setlist med 4 låtar"`
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
      </div>

      <div className="console-history">
        {history.length === 0 && (
          <div className="console-welcome">
            <p>Hej! Jag är din Kizomba AI DJ-assistent.</p>
            <p>Skriv en prompt — t.ex. "Bygg en warm-up setlist" eller "Är övergången smooth?"</p>
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
          placeholder="Skriv en DJ-prompt..."
          className="prompt-input"
        />
        <button type="submit" className="prompt-btn">Skicka</button>
      </form>
    </div>
  )
}
