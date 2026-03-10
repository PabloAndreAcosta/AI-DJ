import React, { useState } from 'react'
import { catalog, energyLabel } from '../data/catalog'

export default function CatalogBrowser({ onLoadToDeck, onAddToSetlist }) {
  const [search, setSearch] = useState('')
  const [genreFilter, setGenreFilter] = useState('All')

  const genres = ['All', ...new Set(catalog.map(t => t.genre))]

  const filtered = catalog.filter(t => {
    const matchSearch = search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
    const matchGenre = genreFilter === 'All' || t.genre === genreFilter
    return matchSearch && matchGenre
  })

  return (
    <div className="catalog">
      <div className="catalog-header">
        <h3>Musikbibliotek ({catalog.length} låtar)</h3>
      </div>

      <div className="catalog-filters">
        <input
          type="text"
          placeholder="Sök artist eller titel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="genre-filters">
          {genres.map(g => (
            <button
              key={g}
              className={`genre-btn ${genreFilter === g ? 'genre-active' : ''}`}
              onClick={() => setGenreFilter(g)}
            >{g}</button>
          ))}
        </div>
      </div>

      <div className="catalog-table">
        <div className="catalog-row catalog-header-row">
          <span className="col-title">Titel</span>
          <span className="col-artist">Artist</span>
          <span className="col-bpm">BPM</span>
          <span className="col-key">Key</span>
          <span className="col-energy">Energy</span>
          <span className="col-genre">Genre</span>
          <span className="col-actions">Åtgärd</span>
        </div>
        {filtered.map(track => (
          <div key={track.id} className="catalog-row">
            <span className="col-title">{track.title}</span>
            <span className="col-artist">{track.artist}</span>
            <span className="col-bpm">{track.bpm}</span>
            <span className="col-key">{track.key}</span>
            <span className="col-energy">
              <span className="energy-bar">
                <span className="energy-fill" style={{ width: `${track.energy * 10}%` }} />
              </span>
              <span className="energy-num">{track.energy}</span>
            </span>
            <span className="col-genre"><span className="tag">{track.genre}</span></span>
            <span className="col-actions">
              <button onClick={() => onLoadToDeck(track, 'A')} className="btn-small">A</button>
              <button onClick={() => onLoadToDeck(track, 'B')} className="btn-small">B</button>
              <button onClick={() => onAddToSetlist(track)} className="btn-small btn-add">+</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
