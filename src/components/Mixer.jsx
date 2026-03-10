import React, { useState, useEffect, useRef } from 'react'
import { bpmCompatible, keyCompatible, genreCompatible } from '../data/catalog'

function Waveform({ active, color }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    function draw() {
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x < w; x++) {
        const amp = active ? (h / 2 - 4) * (0.3 + 0.7 * Math.abs(Math.sin(x * 0.05 + offsetRef.current))) : (h / 2 - 10) * 0.2
        const y = h / 2 + amp * Math.sin(x * 0.08 + offsetRef.current * 2)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      if (active) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let x = 0; x < w; x++) {
          const amp = (h / 2 - 8) * (0.2 + 0.5 * Math.abs(Math.cos(x * 0.03 + offsetRef.current * 1.5)))
          const y = h / 2 + amp * Math.cos(x * 0.06 + offsetRef.current * 3)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      if (active) offsetRef.current += 0.03
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [active, color])

  return <canvas ref={canvasRef} width={400} height={80} className="waveform-canvas" />
}

function BpmRing({ bpm, active }) {
  const circumference = 2 * Math.PI * 36
  const progress = bpm ? Math.min(bpm / 130, 1) : 0

  return (
    <svg width="90" height="90" className="bpm-ring">
      <circle cx="45" cy="45" r="36" fill="none" stroke="#333" strokeWidth="4" />
      <circle
        cx="45" cy="45" r="36" fill="none"
        stroke={active ? '#e91e63' : '#555'}
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s, stroke 0.3s', transform: 'rotate(-90deg)', transformOrigin: '45px 45px' }}
      />
      <text x="45" y="42" textAnchor="middle" fill={active ? '#fff' : '#888'} fontSize="16" fontWeight="bold">
        {bpm || '—'}
      </text>
      <text x="45" y="58" textAnchor="middle" fill="#888" fontSize="10">BPM</text>
    </svg>
  )
}

function Deck({ label, track, volume, onVolumeChange, active, color, onLoadFromCatalog }) {
  return (
    <div className={`deck ${active ? 'deck-active' : ''}`}>
      <div className="deck-header">
        <span className="deck-label">{label}</span>
        {active && <span className="deck-playing">PLAYING</span>}
      </div>
      <Waveform active={active && !!track} color={color} />
      <div className="deck-info">
        <BpmRing bpm={track?.bpm} active={active} />
        <div className="deck-track-info">
          {track ? (
            <>
              <div className="deck-title">{track.title}</div>
              <div className="deck-artist">{track.artist}</div>
              <div className="deck-meta">
                <span className="tag">{track.key}</span>
                <span className="tag">{track.genre}</span>
                <span className="tag">E:{track.energy}</span>
              </div>
            </>
          ) : (
            <div className="deck-empty">Ingen låt laddad</div>
          )}
        </div>
      </div>
      <div className="deck-controls">
        <label className="volume-label">
          VOL
          <input
            type="range" min="0" max="100" value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-value">{volume}%</span>
        </label>
      </div>
    </div>
  )
}

export default function Mixer({ deckA, deckB, onLoadDeck }) {
  const [volumeA, setVolumeA] = useState(80)
  const [volumeB, setVolumeB] = useState(80)
  const [crossfader, setCrossfader] = useState(50)
  const [activeDeck, setActiveDeck] = useState('A')

  const bpmOk = deckA && deckB ? bpmCompatible(deckA.bpm, deckB.bpm) : null
  const keyOk = deckA && deckB ? keyCompatible(deckA.key, deckB.key) : null
  const genreOk = deckA && deckB ? genreCompatible(deckA.genre, deckB.genre) : null

  return (
    <div className="mixer">
      <div className="decks-row">
        <Deck
          label="DECK A" track={deckA} volume={volumeA}
          onVolumeChange={setVolumeA} active={activeDeck === 'A'}
          color="#e91e63"
        />
        <div className="mixer-center">
          <div className="compatibility-panel">
            <h4>Transition</h4>
            {deckA && deckB ? (
              <>
                <div className={`compat-item ${bpmOk ? 'compat-ok' : 'compat-warn'}`}>
                  BPM {bpmOk ? '✓' : '✗'} ({deckA.bpm} → {deckB.bpm})
                </div>
                <div className={`compat-item ${keyOk ? 'compat-ok' : keyOk === null ? 'compat-unknown' : 'compat-warn'}`}>
                  KEY {keyOk ? '✓' : keyOk === null ? '?' : '✗'} ({deckA.key} → {deckB.key})
                </div>
                <div className={`compat-item ${genreOk ? 'compat-ok' : 'compat-warn'}`}>
                  Genre {genreOk ? '✓' : '✗'} ({deckA.genre} → {deckB.genre})
                </div>
                <div className={`compat-item ${Math.abs(deckA.energy - deckB.energy) <= 3 ? 'compat-ok' : 'compat-warn'}`}>
                  Energy {Math.abs(deckA.energy - deckB.energy) <= 3 ? '✓' : '✗'} ({deckA.energy} → {deckB.energy})
                </div>
              </>
            ) : (
              <div className="compat-empty">Ladda båda decks</div>
            )}
          </div>

          <div className="crossfader-section">
            <span className="cf-label">A</span>
            <input
              type="range" min="0" max="100" value={crossfader}
              onChange={(e) => setCrossfader(Number(e.target.value))}
              className="crossfader"
            />
            <span className="cf-label">B</span>
          </div>

          <div className="deck-switch">
            <button
              className={`switch-btn ${activeDeck === 'A' ? 'switch-active' : ''}`}
              onClick={() => setActiveDeck('A')}
            >A</button>
            <button
              className={`switch-btn ${activeDeck === 'B' ? 'switch-active' : ''}`}
              onClick={() => setActiveDeck('B')}
            >B</button>
          </div>
        </div>
        <Deck
          label="DECK B" track={deckB} volume={volumeB}
          onVolumeChange={setVolumeB} active={activeDeck === 'B'}
          color="#00bcd4"
        />
      </div>
    </div>
  )
}
