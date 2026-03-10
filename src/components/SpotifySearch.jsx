import React, { useState, useCallback } from 'react'
import { searchTracks, getMultipleTrackFeatures, spotifyToTrack } from '../lib/spotify'

export default function SpotifySearch({ token, onLoadToDeck, onAddToSetlist }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    if (!query.trim() || !token) return

    setLoading(true)
    setError(null)
    try {
      const data = await searchTracks(query, token, 12)
      const tracks = data.tracks.items

      // Get audio features for BPM/key/energy
      const ids = tracks.map(t => t.id)
      let features = {}
      try {
        const featuresData = await getMultipleTrackFeatures(ids, token)
        if (featuresData?.audio_features) {
          featuresData.audio_features.forEach(f => {
            if (f) features[f.id] = f
          })
        }
      } catch {
        // Features may not be available for all tracks
      }

      const enriched = tracks.map(t => spotifyToTrack(t, features[t.id]))
      setResults(enriched)
    } catch (err) {
      setError(err.message === 'TOKEN_EXPIRED' ? 'Spotify-sessionen har gått ut. Logga in igen.' : err.message)
    } finally {
      setLoading(false)
    }
  }, [query, token])

  function formatDuration(ms) {
    const min = Math.floor(ms / 60000)
    const sec = Math.floor((ms % 60000) / 1000)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="spotify-search">
      <form onSubmit={handleSearch} className="spotify-search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök Kizomba, Semba, Zouk på Spotify..."
          className="search-input"
          disabled={loading}
        />
        <button type="submit" className="prompt-btn" disabled={loading}>
          {loading ? '...' : 'Sök'}
        </button>
      </form>

      {error && <div className="spotify-error">{error}</div>}

      <div className="spotify-results">
        {results.map(track => (
          <div key={track.spotifyId} className="spotify-track">
            {track.albumArt && (
              <img src={track.albumArt} alt="" className="spotify-art" />
            )}
            <div className="spotify-track-info">
              <div className="spotify-track-title">{track.title}</div>
              <div className="spotify-track-artist">{track.artist}</div>
              <div className="spotify-track-meta">
                {track.bpm && <span className="tag">{track.bpm} BPM</span>}
                <span className="tag">{track.key}</span>
                <span className="tag">E:{track.energy}</span>
                <span className="tag">{formatDuration(track.duration)}</span>
              </div>
            </div>
            <div className="spotify-track-actions">
              <button onClick={() => onLoadToDeck(track, 'A')} className="btn-small">A</button>
              <button onClick={() => onLoadToDeck(track, 'B')} className="btn-small">B</button>
              <button onClick={() => onAddToSetlist(track)} className="btn-small btn-add">+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
