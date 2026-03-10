import React, { useState } from 'react'
import Mixer from './components/Mixer'
import AiConsole from './components/AiConsole'
import Setlist from './components/Setlist'
import CatalogBrowser from './components/Catalog'

const TABS = [
  { id: 'mixer', label: 'Mixer', icon: '🎛' },
  { id: 'ai', label: 'AI DJ', icon: '🤖' },
  { id: 'setlist', label: 'Setlist', icon: '📋' },
  { id: 'catalog', label: 'Katalog', icon: '💿' },
]

export default function App() {
  const [tab, setTab] = useState('mixer')
  const [deckA, setDeckA] = useState(null)
  const [deckB, setDeckB] = useState(null)
  const [setlist, setSetlist] = useState([])

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
        </nav>
      </header>

      <main className="app-main">
        {tab === 'mixer' && (
          <Mixer deckA={deckA} deckB={deckB} onLoadDeck={handleLoadToDeck} />
        )}
        {tab === 'ai' && (
          <AiConsole
            deckA={deckA} deckB={deckB}
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
      </main>
    </div>
  )
}
