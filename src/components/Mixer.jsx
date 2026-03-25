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

  return <canvas ref={canvasRef} width={300} height={60} className="waveform-canvas" />
}

function BpmRing({ bpm, active }) {
  const circumference = 2 * Math.PI * 28
  const progress = bpm ? Math.min(bpm / 130, 1) : 0

  return (
    <svg width="70" height="70" className="bpm-ring">
      <circle cx="35" cy="35" r="28" fill="none" stroke="#333" strokeWidth="3" />
      <circle
        cx="35" cy="35" r="28" fill="none"
        stroke={active ? '#e91e63' : '#555'}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s, stroke 0.3s', transform: 'rotate(-90deg)', transformOrigin: '35px 35px' }}
      />
      <text x="35" y="33" textAnchor="middle" fill={active ? '#fff' : '#888'} fontSize="14" fontWeight="bold">
        {bpm || '—'}
      </text>
      <text x="35" y="47" textAnchor="middle" fill="#888" fontSize="9">BPM</text>
    </svg>
  )
}

function Deck({ label, track, active, color, isPlaying }) {
  return (
    <div className={`deck ${active ? 'deck-active' : ''}`}>
      <div className="deck-header">
        <span className="deck-label">{label}</span>
        {active && <span className="deck-playing">PLAYING</span>}
      </div>
      <Waveform active={active && isPlaying && !!track} color={color} />
      <div className="deck-info">
        {track?.albumArt && <img src={track.albumArt} alt="" className="deck-album-art" />}
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
                {track.isSpotify && <span className="tag tag-spotify">Spotify</span>}
              </div>
            </>
          ) : (
            <div className="deck-empty">Ingen låt laddad</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Mixer({ deckA, deckB, activeDeck, isPlaying }) {
  const bpmOk = deckA && deckB ? bpmCompatible(deckA.bpm, deckB.bpm) : null
  const keyOk = deckA && deckB ? keyCompatible(deckA.key, deckB.key) : null
  const genreOk = deckA && deckB ? genreCompatible(deckA.genre, deckB.genre) : null

  return (
    <div className="mixer-panel">
      <Deck
        label="DECK A" track={deckA}
        active={activeDeck === 'A'}
        color="#e91e63"
        isPlaying={isPlaying}
      />

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

      <Deck
        label="DECK B" track={deckB}
        active={activeDeck === 'B'}
        color="#00bcd4"
        isPlaying={isPlaying}
      />
    </div>
  )
}
