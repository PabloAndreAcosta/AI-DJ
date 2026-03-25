import { playTrack, pausePlayback, setVolume as spotifySetVolume, searchTracks } from './spotify'
import { startBeat, stopBeat, setBeatVolume } from './beatSynth'

// ─── Spotify Web Playback SDK ────────────────────────────────
let player = null
let deviceId = null
let sdkReady = false
let sdkReadyPromise = null

export function initSpotifySDK(token, onStateChange) {
  if (player) return

  sdkReadyPromise = new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      sdkReady = true

      player = new window.Spotify.Player({
        name: 'Kizomba AI DJ',
        getOAuthToken: cb => cb(token),
        volume: 0.8,
      })

      player.addListener('ready', ({ device_id }) => {
        deviceId = device_id
        console.log('🎛 Spotify SDK ready, device:', device_id)
        resolve(device_id)
      })

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Spotify device offline:', device_id)
        deviceId = null
      })

      player.addListener('player_state_changed', (state) => {
        if (onStateChange) onStateChange(state)
      })

      player.addListener('initialization_error', ({ message }) => {
        console.error('Spotify init error:', message)
        resolve(null)
      })

      player.addListener('authentication_error', ({ message }) => {
        console.error('Spotify auth error:', message)
        resolve(null)
      })

      player.connect()
    }
  })

  if (!document.getElementById('spotify-sdk')) {
    const script = document.createElement('script')
    script.id = 'spotify-sdk'
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
  }

  return sdkReadyPromise
}

export function destroySpotifySDK() {
  if (player) {
    player.disconnect()
    player = null
    deviceId = null
    sdkReady = false
  }
}

// ─── HTML5 Audio (for previews) ──────────────────────────────
let audioElement = null

function getAudio() {
  if (!audioElement) {
    audioElement = new Audio()
    audioElement.crossOrigin = 'anonymous'
  }
  return audioElement
}

// Track which source is active so we stop the right one
let activeSource = null // 'spotify' | 'preview' | 'synth'

// ─── Unified playback ────────────────────────────────────────

export async function play(track, token, volume = 80) {
  if (!track) return false

  // Stop any previous source first
  await stop(token)

  // 1) Try Spotify SDK for Spotify tracks
  if (track.isSpotify && track.spotifyUri && token && deviceId) {
    try {
      await playTrack(track.spotifyUri, token, deviceId)
      await spotifySetVolume(volume, token)
      activeSource = 'spotify'
      return 'spotify'
    } catch (err) {
      console.warn('Spotify SDK play failed:', err.message)
    }
  }

  // 2) Try preview URL
  const previewUrl = track.previewUrl || track.preview_url
  if (previewUrl) {
    try {
      const audio = getAudio()
      audio.src = previewUrl
      audio.volume = volume / 100
      await audio.play()
      activeSource = 'preview'
      return 'preview'
    } catch (err) {
      console.warn('Preview play failed:', err.message)
    }
  }

  // 3) Auto-search Spotify for playback/preview
  if (token && track.title && track.artist) {
    try {
      const query = `${track.title} ${track.artist}`
      const results = await searchTracks(query, token, 1)
      const found = results?.tracks?.items?.[0]
      if (found) {
        if (deviceId) {
          try {
            await playTrack(found.uri, token, deviceId)
            await spotifySetVolume(volume, token)
            activeSource = 'spotify'
            return 'spotify'
          } catch {}
        }
        if (found.preview_url) {
          try {
            const audio = getAudio()
            audio.src = found.preview_url
            audio.volume = volume / 100
            await audio.play()
            activeSource = 'preview'
            return 'preview'
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Auto-search failed:', err.message)
    }
  }

  // 4) Beat synth fallback — always works, no external deps
  startBeat(track)
  setBeatVolume(volume)
  activeSource = 'synth'
  return 'synth'
}

export async function pause(token) {
  if (activeSource === 'spotify' && player && deviceId && token) {
    try { await pausePlayback(token) } catch {}
  }
  if (activeSource === 'preview' && audioElement && !audioElement.paused) {
    audioElement.pause()
  }
  if (activeSource === 'synth') {
    stopBeat()
  }
  activeSource = null
}

export async function stop(token) {
  await pause(token)
  if (audioElement) {
    audioElement.currentTime = 0
  }
  stopBeat() // make sure synth is stopped
}

export async function setEngineVolume(volume, token) {
  const v = Math.max(0, Math.min(100, volume))

  // Always update all engines
  setBeatVolume(v)

  if (audioElement) {
    audioElement.volume = v / 100
  }
  if (player) {
    player.setVolume(v / 100).catch(() => {})
  }
  if (token && deviceId) {
    try { await spotifySetVolume(v, token) } catch {}
  }
}

export function onTrackEnd(callback) {
  const audio = getAudio()
  audio.onended = callback
}

export function getProgress() {
  if (audioElement && audioElement.duration) {
    return audioElement.currentTime / audioElement.duration
  }
  return 0
}

export function isSDKReady() {
  return sdkReady && !!deviceId
}

export function getActiveSource() {
  return activeSource
}
