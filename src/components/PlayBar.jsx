import React from 'react'

export default function PlayBar({ currentTrack, isPlaying, volume, playbackSource, onPlayPause, onNext, onVolumeUp, onVolumeDown }) {
  return (
    <div className="play-bar">
      <div className="play-bar-track">
        {currentTrack ? (
          <>
            {currentTrack.albumArt && (
              <img src={currentTrack.albumArt} alt="" className="play-bar-art" />
            )}
            <span className="play-bar-icon">🎵</span>
            <div className="play-bar-info">
              <span className="play-bar-title">{currentTrack.title}</span>
              <span className="play-bar-artist">
                {currentTrack.artist}
                <span className="play-bar-meta">
                  {currentTrack.bpm && ` · ${currentTrack.bpm} BPM`}
                  {currentTrack.key && ` · ${currentTrack.key}`}
                </span>
              </span>
            </div>
            {playbackSource && (
              <span className={`play-bar-source source-${playbackSource}`}>
                {playbackSource === 'spotify' ? '♫ Spotify' : playbackSource === 'preview' ? '♫ Preview' : '♫ Synth'}
              </span>
            )}
          </>
        ) : (
          <span className="play-bar-empty">Ladda en låt till ett deck för att spela</span>
        )}
      </div>

      <div className="play-bar-controls">
        <button
          className={`play-bar-btn ${isPlaying ? 'play-bar-btn-active' : ''}`}
          onClick={onPlayPause}
          title={isPlaying ? 'Stopp' : 'Spela'}
        >
          {isPlaying ? '■' : '▶'}
        </button>
        <button className="play-bar-btn" onClick={onNext} title="Nästa (byt deck)">
          ⏭
        </button>
      </div>

      <div className="play-bar-volume">
        <button className="play-bar-vol-btn" onClick={onVolumeDown} title="Volym −">−</button>
        <div className="play-bar-vol-bar">
          <div className="play-bar-vol-fill" style={{ width: `${volume}%` }} />
        </div>
        <span className="play-bar-vol-num">{volume}</span>
        <button className="play-bar-vol-btn" onClick={onVolumeUp} title="Volym +">+</button>
      </div>
    </div>
  )
}
