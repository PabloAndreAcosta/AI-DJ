# Kizomba AI DJ

AI-driven DJ-webapp for Kizomba-paraplyet: Kizomba, Urban Kiz, Ghetto Zouk, Tarraxo, Semba, Zouk, Afrobeats, Electro Cumbia, Folktronic, Kuduro, Kompa och Afro House.

## Features

- **Mixer** — Dual deck med animerade waveforms, BPM-ringar, volym, crossfader och genre-kompatibilitet
- **AI DJ Console** — Claude API for naturligt sprak-prompts, med lokal fallback
- **Spotify Integration** — Sok och ladda riktiga latar med BPM, key och energi via Audio Features
- **Setlist** — Visuell energikurva, ladda latar direkt till decks
- **Katalog** — 52 latar over 12 genrer med sok, filter och Camelot wheel key-kompatibilitet
- **Responsiv** — Fungerar pa desktop, tablet och mobil

## Getting Started

```bash
# Installera
npm install

# Kopiera och fyll i API-nycklar
cp .env.example .env

# Starta frontend (port 5173)
npm run dev

# Starta backend for Claude API + Spotify auth (port 3001)
npm run server
```

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...       # Claude API-nyckel
SPOTIFY_CLIENT_ID=...              # Fran developer.spotify.com/dashboard
VITE_SPOTIFY_CLIENT_ID=...         # Samma som ovan, for frontend
```

## Tech Stack

- React 19 + Vite (frontend)
- Express (backend API-proxy)
- Claude API (@anthropic-ai/sdk) for AI DJ-assistenten
- Spotify Web API med PKCE auth-flow
- Canvas-baserade waveforms och energikurvor
