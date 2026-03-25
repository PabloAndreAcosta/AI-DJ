import React, { useRef, useEffect } from 'react'

function EnergyCurve({ tracks }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Background grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.5
    for (let i = 1; i <= 10; i++) {
      const y = h - (i / 10) * h
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    if (tracks.length === 0) return

    const padding = 30
    const usableW = w - padding * 2

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(233, 30, 99, 0.6)')
    grad.addColorStop(1, 'rgba(233, 30, 99, 0.05)')

    ctx.beginPath()
    ctx.moveTo(padding, h)
    tracks.forEach((track, i) => {
      const x = padding + (i / (tracks.length - 1 || 1)) * usableW
      const y = h - (track.energy / 10) * (h - 10)
      if (i === 0) ctx.lineTo(x, y)
      else {
        const prevX = padding + ((i - 1) / (tracks.length - 1 || 1)) * usableW
        const cpX = (prevX + x) / 2
        const prevY = h - (tracks[i - 1].energy / 10) * (h - 10)
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
      }
    })
    ctx.lineTo(padding + usableW, h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    tracks.forEach((track, i) => {
      const x = padding + (i / (tracks.length - 1 || 1)) * usableW
      const y = h - (track.energy / 10) * (h - 10)
      if (i === 0) ctx.moveTo(x, y)
      else {
        const prevX = padding + ((i - 1) / (tracks.length - 1 || 1)) * usableW
        const cpX = (prevX + x) / 2
        const prevY = h - (tracks[i - 1].energy / 10) * (h - 10)
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
      }
    })
    ctx.strokeStyle = '#e91e63'
    ctx.lineWidth = 3
    ctx.stroke()

    // Dots and labels
    tracks.forEach((track, i) => {
      const x = padding + (i / (tracks.length - 1 || 1)) * usableW
      const y = h - (track.energy / 10) * (h - 10)

      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#e91e63'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#aaa'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      const shortTitle = track.title.length > 12 ? track.title.slice(0, 12) + '..' : track.title
      ctx.fillText(shortTitle, x, h - 2)
    })
  }, [tracks])

  return <canvas ref={canvasRef} width={600} height={180} className="energy-canvas" />
}

export default function Setlist({ tracks, onLoadToDeck, onRemoveTrack }) {
  return (
    <div className="setlist">
      <div className="setlist-header">
        <h3>Setlist ({tracks.length} låtar)</h3>
      </div>

      {tracks.length > 0 && (
        <div className="energy-curve-container">
          <h4>Energikurva</h4>
          <EnergyCurve tracks={tracks} />
        </div>
      )}

      {tracks.length === 0 ? (
        <div className="setlist-empty">
          <p>Ingen setlist ännu. Använd AI DJ Console för att generera en, eller lägg till låtar från katalogen.</p>
        </div>
      ) : (
        <div className="setlist-tracks">
          {tracks.map((track, i) => (
            <div key={`${track.id}-${i}`} className="setlist-item">
              <span className="setlist-num">{i + 1}</span>
              <div className="setlist-item-info">
                <div className="setlist-item-title">{track.title}</div>
                <div className="setlist-item-meta">{track.artist} · {track.bpm} BPM · {track.key} · E:{track.energy}</div>
              </div>
              <div className="setlist-item-actions">
                <button onClick={() => onLoadToDeck(track, 'A')} className="btn-small">→ A</button>
                <button onClick={() => onLoadToDeck(track, 'B')} className="btn-small">→ B</button>
                <button onClick={() => onRemoveTrack(i)} className="btn-small btn-remove">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
