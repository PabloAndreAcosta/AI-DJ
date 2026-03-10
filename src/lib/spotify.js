const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

function getRedirectUri() {
  return `${window.location.origin}/callback`
}

function getClientId() {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
}

// PKCE helpers
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

function base64encode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export async function startSpotifyAuth() {
  const clientId = getClientId()
  if (!clientId) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID saknas i .env')
  }

  const codeVerifier = generateRandomString(64)
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed)

  sessionStorage.setItem('spotify_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: getRedirectUri(),
  })

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`
}

export async function handleSpotifyCallback(code) {
  const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
  if (!codeVerifier) throw new Error('Ingen code verifier hittades')

  const apiBase = import.meta.env.VITE_API_URL || ''
  const response = await fetch(`${apiBase}/api/spotify/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      codeVerifier,
      redirectUri: getRedirectUri(),
    }),
  })

  const data = await response.json()
  if (data.error) throw new Error(data.error)

  sessionStorage.removeItem('spotify_code_verifier')
  return data
}

export async function refreshSpotifyToken(refreshToken) {
  const apiBase = import.meta.env.VITE_API_URL || ''
  const response = await fetch(`${apiBase}/api/spotify/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  return response.json()
}

// Spotify API helpers
export async function spotifyFetch(endpoint, token, options = {}) {
  const response = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (response.status === 401) {
    throw new Error('TOKEN_EXPIRED')
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

export async function searchTracks(query, token, limit = 20) {
  const params = new URLSearchParams({ q: query, type: 'track', limit })
  return spotifyFetch(`/search?${params}`, token)
}

export async function getTrackFeatures(trackId, token) {
  return spotifyFetch(`/audio-features/${trackId}`, token)
}

export async function getMultipleTrackFeatures(trackIds, token) {
  const params = new URLSearchParams({ ids: trackIds.join(',') })
  return spotifyFetch(`/audio-features?${params}`, token)
}

export async function playTrack(uri, token, deviceId) {
  const body = { uris: [uri] }
  const endpoint = deviceId
    ? `/me/player/play?device_id=${deviceId}`
    : '/me/player/play'
  return spotifyFetch(endpoint, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function pausePlayback(token) {
  return spotifyFetch('/me/player/pause', token, { method: 'PUT' })
}

export async function setVolume(volumePercent, token) {
  return spotifyFetch(`/me/player/volume?volume_percent=${volumePercent}`, token, {
    method: 'PUT',
  })
}

// Convert Spotify key number to musical key
const KEY_MAP = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const MODE_MAP = { 0: 'm', 1: '' }

export function spotifyKeyToMusical(key, mode) {
  if (key < 0 || key > 11) return '?'
  return KEY_MAP[key] + (MODE_MAP[mode] || '')
}

// Convert Spotify track + features to our format
export function spotifyToTrack(spotifyTrack, features) {
  return {
    id: `sp-${spotifyTrack.id}`,
    spotifyId: spotifyTrack.id,
    spotifyUri: spotifyTrack.uri,
    title: spotifyTrack.name,
    artist: spotifyTrack.artists.map(a => a.name).join(', '),
    album: spotifyTrack.album.name,
    albumArt: spotifyTrack.album.images[0]?.url,
    bpm: features ? Math.round(features.tempo) : null,
    key: features ? spotifyKeyToMusical(features.key, features.mode) : '?',
    energy: features ? Math.round(features.energy * 10) : 5,
    danceability: features ? features.danceability : null,
    genre: 'Spotify',
    duration: spotifyTrack.duration_ms,
    previewUrl: spotifyTrack.preview_url,
    isSpotify: true,
  }
}
