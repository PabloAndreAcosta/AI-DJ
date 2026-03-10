import React, { useState, useEffect } from 'react'
import Mixer from './components/Mixer'
import AiConsole from './components/AiConsole'
import Setlist from './components/Setlist'
import CatalogBrowser from './components/Catalog'
import SpotifySearch from './components/SpotifySearch'
import InstallPrompt from './components/InstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import UpdatePrompt from './components/UpdatePrompt'
import { startSpotifyAuth, handleSpotifyCallback } from './lib/spotify'

const TABS = [
  { id: 'mixer', label: 'Mixer', icon: '🎛' },
  { id: 'ai', label: 'AI DJ', icon: '🤖' },
  { id: 'setlist', label: 'Setlist', icon: '📋' },
  { id: 'catalog', label: 'Katalog', icon: '💿' },
  { id: 'spotify', label: 'Spotify', icon: '🎵' },
]

export default function App() {
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    return ['mixer', 'ai', 'setlist', 'catalog', 'spotify'].includes(t) ? t : 'mixer'
  })
  const [deckA, setDeckA] = useState(null)
  const [deckB, setDeckB] = useState(null)
  const [setlist, setSetlist] = useState(() => {
    try {
      const saved = localStorage.getItem('ai-dj-setlist')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [spotifyToken, setSpotifyToken] = useState(null)
  const [spotifyUser, setSpotifyUser] = useState(null)

  // Persist setlist to localStorage
  useEffect(() => {
    try { localStorage.setItem('ai-dj-setlist', JSON.stringify(setlist)) }
    catch {}
  }, [setlist])

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
          setTab('spotify')
        })
        .catch(err => console.error('Spotify auth error:', err))
    }

    // Restore token from session
    const saved = sessionStorage.getItem('spotify_access_token')
    if (saved) setSpotifyToken(saved)
  }, [])

  // Save token to session
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
    }
  }, [spotifyToken])

  function handleLoadToDeck(track, deck) {
    if (deck === 'A') setDeckA(track)
    else setDeckB(track)
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

  return (
    <div className="app">
      <OfflineIndicator />
      <UpdatePrompt />
      <InstallPrompt />
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
              {t.id === 'spotify' && spotifyToken && <span className="tab-dot" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'mixer' && (
          <Mixer deckA={deckA} deckB={deckB} onLoadDeck={handleLoadToDeck} />
        )}
        {tab === 'ai' && (
          <AiConsole
            deckA={deckA} deckB={deckB}
            setlist={setlist}
            onSetlistGenerated={handleSetlistGenerated}
          />
        )}
        {tab === 'setlist' && (
          <Setlist
            tracks={setlist}
            onLoadToDeck={handleLoadToDeck}
            onRemoveTrack={handleRemoveFromSetlist}
          />
        )}
        {tab === 'catalog' && (
          <CatalogBrowser
            onLoadToDeck={handleLoadToDeck}
            onAddToSetlist={handleAddToSetlist}
          />
        )}
        {tab === 'spotify' && (
          <div className="spotify-tab">
            {spotifyToken ? (
              <>
                <div className="spotify-header">
                  <div className="spotify-connected">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <span>Ansluten{spotifyUser ? ` som ${spotifyUser.display_name}` : ''}</span>
                    <button onClick={handleSpotifyLogout} className="btn-small btn-remove">Logga ut</button>
                  </div>
                </div>
                <SpotifySearch
                  token={spotifyToken}
                  onLoadToDeck={handleLoadToDeck}
                  onAddToSetlist={handleAddToSetlist}
                />
              </>
            ) : (
              <div className="spotify-login">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="#1DB954">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <h3>Anslut Spotify</h3>
                <p>Sök och spela riktiga låtar direkt i DJ-appen. Få BPM, key och energi automatiskt via Spotify Audio Features.</p>
                <button onClick={handleSpotifyLogin} className="spotify-login-btn">
                  Logga in med Spotify
                </button>
                <p className="spotify-note">Kräver Spotify Premium för uppspelning. VITE_SPOTIFY_CLIENT_ID måste sättas i .env</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
