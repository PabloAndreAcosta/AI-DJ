import React, { useState, useEffect, useRef, useCallback } from 'react'
import Mixer from './components/Mixer'
import AiConsole from './components/AiConsole'
import Setlist from './components/Setlist'
import CatalogBrowser from './components/Catalog'
import PlayBar from './components/PlayBar'
import { startSpotifyAuth, handleSpotifyCallback, searchTracks, getMultipleTrackFeatures, spotifyToTrack } from './lib/spotify'
import { initSpotifySDK, destroySpotifySDK, play, pause, stop, setEngineVolume, onTrackEnd } from './lib/audioEngine'
import { ensureAudioContext } from './lib/beatSynth'

const TABS = [
  { id: 'dj', label: 'DJ', icon: '🎛' },
  { id: 'ai', label: 'AI DJ', icon: '🤖' },
  { id: 'setlist', label: 'Setlist', icon: '📋' },
]

export default function App() {
  const [tab, setTab] = useState('dj')
  const [deckA, setDeckA] = useState(null)
  const [deckB, setDeckB] = useState(null)
  const [setlist, setSetlist] = useState([])
  const [spotifyToken, setSpotifyToken] = useState(null)
  const [spotifyUser, setSpotifyUser] = useState(null)

  // Playback state
  const [activeDeck, setActiveDeck] = useState('A')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [playbackSource, setPlaybackSource] = useState(null) // 'spotify' | 'preview' | null
  const [catalogVersion, setCatalogVersion] = useState(0)

  const spotifyTokenRef = useRef(null)
  spotifyTokenRef.current = spotifyToken

  function handleTracksAdded() {
    setCatalogVersion(v => v + 1)
  }

  // Handle Spotify callback on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      window.history.replaceState({}, '', window.location.pathname)
      handleSpotifyCallback(code)
        .then(data => {
          setSpotifyToken(data.access_token)
          if (data.refresh_token) {
            sessionStorage.setItem('spotify_refresh_token', data.refresh_token)
          }
        })
        .catch(err => console.error('Spotify auth error:', err))
    }

    const saved = sessionStorage.getItem('spotify_access_token')
    if (saved) setSpotifyToken(saved)
  }, [])

  // Save token + init Spotify SDK
  useEffect(() => {
    if (spotifyToken) {
      sessionStorage.setItem('spotify_access_token', spotifyToken)

      // Fetch user profile
      fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setSpotifyUser(data) })
        .catch(() => {})

      // Init Spotify SDK for playback
      initSpotifySDK(spotifyToken, (state) => {
        if (!state) {
          setIsPlaying(false)
          setPlaybackSource(null)
        }
      })
    }

    return () => {
      // Don't destroy on every token change, only unmount
    }
  }, [spotifyToken])

  // Cleanup SDK on unmount
  useEffect(() => {
    return () => destroySpotifySDK()
  }, [])

  // When preview track ends, auto-advance
  useEffect(() => {
    onTrackEnd(() => {
      if (isPlaying) {
        handleNext()
      }
    })
  }, [isPlaying])

  // Auto-enrich catalog tracks with Spotify URI/preview for real playback
  async function enrichWithSpotify(track) {
    if (track.spotifyUri || track.previewUrl) return track // already has Spotify data
    const token = spotifyTokenRef.current
    if (!token) return track

    try {
      const query = `${track.title} ${track.artist}`
      const results = await searchTracks(query, token, 3)
      const items = results?.tracks?.items
      if (!items?.length) return track

      // Pick best match (prefer exact title match)
      const best = items.find(i =>
        i.name.toLowerCase().includes(track.title.toLowerCase())
      ) || items[0]

      // Get audio features
      let features = null
      try {
        const featData = await getMultipleTrackFeatures([best.id], token)
        features = featData?.audio_features?.[0]
      } catch {}

      const spotifyData = spotifyToTrack(best, features)

      // Merge: keep our catalog metadata but add Spotify playback data
      return {
        ...track,
        spotifyId: spotifyData.spotifyId,
        spotifyUri: spotifyData.spotifyUri,
        previewUrl: spotifyData.previewUrl,
        albumArt: spotifyData.albumArt,
        isSpotify: true,
      }
    } catch (err) {
      console.warn('Spotify enrich failed:', err.message)
      return track
    }
  }

  async function handleLoadToDeck(track, deck) {
    // Load immediately with what we have
    if (deck === 'A') setDeckA(track)
    else setDeckB(track)

    // Then enrich with Spotify data in background
    const enriched = await enrichWithSpotify(track)
    if (enriched !== track) {
      if (deck === 'A') setDeckA(enriched)
      else setDeckB(enriched)
    }
  }

  async function handleSpotifyLogin() {
    try {
      await startSpotifyAuth()
    } catch (err) {
      alert(err.message)
    }
  }

  function handleSpotifyLogout() {
    setSpotifyToken(null)
    setSpotifyUser(null)
    sessionStorage.removeItem('spotify_access_token')
    sessionStorage.removeItem('spotify_refresh_token')
  }

  function handleAddToSetlist(track) {
    setSetlist(prev => [...prev, track])
  }

  function handleRemoveFromSetlist(index) {
    setSetlist(prev => prev.filter((_, i) => i !== index))
  }

  function handleSetlistGenerated(tracks) {
    setSetlist(tracks)
    setTab('setlist')
  }

  // ─── Playback handlers with real audio ───────────────────
  async function handlePlayPause() {
    // CRITICAL: create/resume AudioContext synchronously in click handler
    // before any await, otherwise browser blocks audio
    ensureAudioContext()

    const track = activeDeck === 'A' ? deckA : deckB

    if (isPlaying) {
      await pause(spotifyTokenRef.current)
      setIsPlaying(false)
      setPlaybackSource(null)
    } else {
      if (!track) return
      const source = await play(track, spotifyTokenRef.current, volume)
      if (source) {
        setIsPlaying(true)
        setPlaybackSource(source)
      }
    }
  }

  async function handleNext() {
    ensureAudioContext()
    // Stop current playback
    await stop(spotifyTokenRef.current)

    const nextDeck = activeDeck === 'A' ? 'B' : 'A'
    // The track already loaded on the other deck
    const existingTrack = nextDeck === 'A' ? deckA : deckB

    // Load next from setlist to the currently-playing (soon inactive) deck
    if (setlist.length > 0) {
      const fromSetlist = setlist[0]
      // Load setlist track onto the deck we're leaving
      if (activeDeck === 'A') setDeckA(fromSetlist)
      else setDeckB(fromSetlist)
      setSetlist(prev => prev.slice(1))
    }

    setActiveDeck(nextDeck)

    // Play the track on the new active deck
    if (existingTrack && isPlaying) {
      setTimeout(async () => {
        const source = await play(existingTrack, spotifyTokenRef.current, volume)
        if (source) {
          setPlaybackSource(source)
        }
      }, 200)
    } else {
      setIsPlaying(false)
      setPlaybackSource(null)
    }
  }

  async function handleVolumeUp() {
    const newVol = Math.min(volume + 10, 100)
    setVolume(newVol)
    await setEngineVolume(newVol, spotifyTokenRef.current)
  }

  async function handleVolumeDown() {
    const newVol = Math.max(volume - 10, 0)
    setVolume(newVol)
    await setEngineVolume(newVol, spotifyTokenRef.current)
  }

  const currentTrack = activeDeck === 'A' ? deckA : deckB

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🎛</span>
          <h1>Kizomba AI DJ</h1>
        </div>
        <nav className="tab-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
          {spotifyToken ? (
            <span className="spotify-badge">
              <span className="tab-dot" /> {spotifyUser?.display_name || 'Spotify'}
              <button onClick={handleSpotifyLogout} className="spotify-logout-btn" title="Logga ut">✕</button>
            </span>
          ) : (
            <button onClick={handleSpotifyLogin} className="spotify-connect-btn" title="Anslut Spotify för riktiga låtar">
              🎵 Spotify
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'dj' && (
          <div className="dj-layout">
            <aside className="dj-sidebar">
              <Mixer deckA={deckA} deckB={deckB} activeDeck={activeDeck} isPlaying={isPlaying} />
            </aside>
            <section className="dj-content">
              <CatalogBrowser
                key={catalogVersion}
                onLoadToDeck={handleLoadToDeck}
                onAddToSetlist={handleAddToSetlist}
                spotifyToken={spotifyToken}
              />
            </section>
          </div>
        )}
        {tab === 'ai' && (
          <AiConsole
            deckA={deckA} deckB={deckB}
            setlist={setlist}
            onSetlistGenerated={handleSetlistGenerated}
            onTracksAdded={handleTracksAdded}
          />
        )}
        {tab === 'setlist' && (
          <Setlist
            tracks={setlist}
            onLoadToDeck={handleLoadToDeck}
            onRemoveTrack={handleRemoveFromSetlist}
          />
        )}
      </main>

      <PlayBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        volume={volume}
        playbackSource={playbackSource}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onVolumeUp={handleVolumeUp}
        onVolumeDown={handleVolumeDown}
      />
    </div>
  )
}
